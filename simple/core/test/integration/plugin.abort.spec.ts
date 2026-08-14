import { createDeferred } from '@kwsites/promise-deferred';
import { promiseError } from '@kwsites/promise-result';

import { GitPluginError, type SimpleGitCoreOptions } from '../../index';
import {
   assertGitError,
   createAbortController,
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
   wait,
} from '../__fixtures__/integration';

/**
 * `stripspace` reads its input from stdin, which the executor opens as a pipe
 * and never closes - the child process therefore stays alive until something
 * kills it. Using it in place of a real-work command (a `clone` that may or
 * may not out-run the controller) means the abort signal always has a live
 * process to act on.
 */
const NEVER_EXITS = 'stripspace';

/**
 * A latch resolving once `count` child processes have spawned. The
 * `outputHandler` option is invoked from the pipeline's `onSpawned` stage, so
 * triggering on it replaces guessing at a delay long enough for every instance
 * to have reached its spawn.
 */
function spawnLatch(count: number) {
   const allSpawned = createDeferred();
   const onSpawn = () => {
      if (--count === 0) {
         allSpawned.done();
      }
   };

   return { onSpawn, allSpawned: allSpawned.promise };
}

describe('timeout', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('kills processes on abort signal', async () => {
      const { controller, abort } = createAbortController();

      const threw = promiseError(newSimpleGit(context.root, { abort }).init());

      await wait(0);
      controller.abort();

      assertGitError(await threw, 'Abort signal received', GitPluginError);
   });

   it('share AbortController across many instances', async () => {
      const { controller, abort } = createAbortController();
      const { onSpawn, allSpawned } = spawnLatch(6);

      const repos = await Promise.all(Array.from('abcdef', (p) => context.dir(p)));

      const tasks = repos.map((baseDir) =>
         promiseError(newSimpleGit({ baseDir, abort, outputHandler: onSpawn }).raw(NEVER_EXITS))
      );

      await allSpawned;
      controller.abort();

      for (const result of await Promise.all(tasks)) {
         assertGitError(result, 'Abort signal received', GitPluginError);
      }
   });

   it('terminates the child process rather than just rejecting the task', async () => {
      const { controller, abort } = createAbortController();
      const childPid = createDeferred<number>();

      const config: Partial<SimpleGitCoreOptions> = {
         abort,
         allowEnvironment: ['GIT_TRACE2_EVENT'],
         outputHandler(_command, _stdOut, stdErr) {
            stdErr.on('data', (buffer: Buffer) => {
               const [, pid] = /-P([0-9a-f]+)/.exec(String(buffer)) || [];
               if (pid) {
                  childPid.done(parseInt(pid, 16));
               }
            });
         },
      };

      // git's trace2 session id embeds the process id as a hex-encoded `-P`
      // component, which is the only route to the real pid of the child - the
      // `outputHandler` option receives its streams but not the process itself
      const threw = promiseError(
         newSimpleGit(context.root, config).env('GIT_TRACE2_EVENT', '1').raw(NEVER_EXITS)
      );

      // signal 0 checks for the existence of the process without sending
      // anything to it - asserting it both ways keeps the post-abort check
      // from passing against a pid that was never live to begin with
      const pid = await childPid.promise;
      expect(() => process.kill(pid, 0)).not.toThrow();

      controller.abort();
      assertGitError(await threw, 'Abort signal received', GitPluginError);

      // ESRCH proves the child was reaped rather than leaked
      expect(() => process.kill(pid, 0)).toThrow(expect.objectContaining({ code: 'ESRCH' }));
   });
});
