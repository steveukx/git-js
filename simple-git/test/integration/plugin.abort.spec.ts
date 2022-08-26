import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
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
      const controller = new AbortController();

      const threw = promiseError(newSimpleGit(context.root, { abort: controller.signal }).init());

      await wait(0);
      controller.abort();

      assertGitError(await threw, 'Abort signal received', GitPluginError);
   });
});
