import { promiseError } from '@kwsites/promise-result';
import { assertExecutedTasksCount, assertGitError, newSimpleGit, wait } from './__fixtures__';
import { GitPluginError } from '../..';

function createAbortController() {
   if (typeof AbortController === 'undefined') {
      return createMockAbortController() as { controller: AbortController; abort: AbortSignal };
   }

   const controller = new AbortController();
   return {
      controller,
      abort: controller.signal,
   };
}

function createMockAbortController(): unknown {
   let aborted = false;
   const abort: any = Object.defineProperty(new EventTarget(), 'aborted', {
      get() {
         return aborted;
      },
   });

   return {
      controller: {
         abort() {
            aborted = true;
            abort.dispatchEvent(new Event('abort'));
         },
      },
      abort,
   };
}

describe('plugin.abort', function () {
   let controller: AbortController;
   let abort: AbortSignal;

   beforeEach(() => {
      const create = createAbortController();
      abort = create.abort;
      controller = create.controller;
   });

   it('aborts an active child process', async () => {
      const git = newSimpleGit({
         abort,
      });

      const queue = promiseError(git.raw('foo'));
      await wait();

      assertExecutedTasksCount(1);
      controller.abort();

      assertGitError(await queue, 'Abort signal received', GitPluginError);
   });

   it('aborts all active promises', async () => {
      const git = newSimpleGit({ abort });
      const all = Promise.all([
         git.raw('a').catch((e) => e),
         git.raw('b').catch((e) => e),
         git.raw('c').catch((e) => e),
      ]);

      await wait();
      assertExecutedTasksCount(3);
      controller.abort();

      expect(await all).toEqual([
         expect.any(GitPluginError),
         expect.any(GitPluginError),
         expect.any(GitPluginError),
      ]);
   });

   it('aborts all steps in chained promises', async () => {
      const git = newSimpleGit({ abort });
      const a = git.raw('a');
      const b = a.raw('b');
      const c = b.raw('c');

      const all = Promise.all([a.catch((e) => e), b.catch((e) => e), c.catch((e) => e)]);

      await wait();
      assertExecutedTasksCount(1);
      controller.abort();

      expect(await all).toEqual([
         expect.any(GitPluginError),
         expect.any(GitPluginError),
         expect.any(GitPluginError),
      ]);
      assertExecutedTasksCount(1);
   });

   it('aborts before attempting to spawn', async () => {
      controller.abort();
      const git = newSimpleGit({ abort });
      assertGitError(await promiseError(git.raw('a')), 'Abort already signaled', GitPluginError);
      assertExecutedTasksCount(0);
   });
});
