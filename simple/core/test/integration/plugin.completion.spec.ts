import { promiseError } from '@kwsites/promise-result';

import {
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
} from '../__fixtures__/integration';

describe('progress-monitor', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('detects successful completion', async () => {
      const git = newSimpleGit(context.root);
      expect(await promiseError(git.init())).toBeUndefined();
   });
});
