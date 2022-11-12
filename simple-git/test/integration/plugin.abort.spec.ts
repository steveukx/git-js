import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createAbortController,
   createTestContext,
   newSimpleGit,
   SimpleGitTestContext,
   wait,
} from '@simple-git/test-utils';

import { GitPluginError } from '../..';

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
      const upstream = await newSimpleGit(__dirname).revparse('--git-dir');

      const repos = await Promise.all('abcdef'.split('').map((p) => context.dir(p)));

      repos.map((baseDir) => {
         const git = newSimpleGit({ baseDir, abort });
         if (baseDir.endsWith('a')) {
            return promiseError(git.init());
         }
         return promiseError(git.clone(upstream, baseDir));
      });

      await wait(0);
      controller.abort();

      const results = await Promise.all(
         repos.map((baseDir) => newSimpleGit(baseDir).checkIsRepo())
      );

      expect(results).toContain(false);
      expect(results).toContain(true);
   });
});
