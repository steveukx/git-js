import { promiseError } from '@kwsites/promise-result';
import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('progress-monitor', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('detects successful completion', async () => {
      const git = newSimpleGit(context.root);
      expect(await promiseError(git.init())).toBeUndefined();
   });
});
