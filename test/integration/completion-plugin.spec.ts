import { promiseError } from '@kwsites/promise-result';
import { createTestContext, newSimpleGit, SimpleGitTestContext } from '../__fixtures__';

describe('progress-monitor', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());

   it('detects successful completion', async () => {
      const git = newSimpleGit(context.root);
      expect(await promiseError(git.init())).toBeUndefined();
   });

});
