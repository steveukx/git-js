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

      const repos = await Promise.all(
         'abcdefghijklmnopqrstuvwxyz'.split('').map((p) => context.dir(p))
      );

      await Promise.race(repos.map((baseDir) => newSimpleGit({ baseDir, abort }).init()));
      controller.abort();

      const results = await Promise.all(
         repos.map((baseDir) => newSimpleGit(baseDir).checkIsRepo())
      );

      expect(results).toContain(false);
      expect(results).toContain(true);
   });
});
