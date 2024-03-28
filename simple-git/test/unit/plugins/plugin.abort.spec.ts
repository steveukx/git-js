import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedTasksCount,
   assertGitError,
   createAbortController,
   newSimpleGit,
   wait,
} from '../__fixtures__';
import { GitPluginError } from '../../..';

describe('plugin.abort', function () {
   it('aborts an active child process', async () => {
      const { controller, abort } = createAbortController();
      const git = newSimpleGit({ abort });

      const queue = promiseError(git.raw('foo'));
      await wait();

      assertExecutedTasksCount(1);
      controller.abort();

      assertGitError(await queue, 'Abort signal received', GitPluginError);
   });

   it('aborts all active promises', async () => {
      const { controller, abort } = createAbortController();
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
      const { controller, abort } = createAbortController();
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
      const { controller, abort } = createAbortController();
      controller.abort();

      const git = newSimpleGit({ abort });
      assertGitError(await promiseError(git.raw('a')), 'Abort already signaled', GitPluginError);
      assertExecutedTasksCount(0);
   });
});
