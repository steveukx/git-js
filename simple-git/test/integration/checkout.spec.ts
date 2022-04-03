import { promiseError } from '@kwsites/promise-result';
import { initRepo } from '@simple-git/test-utils';
import type { SimpleGit } from '../../typings';
import { createTestContext, newSimpleGit, SimpleGitTestContext } from '../__fixtures__';

describe('checkout', () => {

   let context: SimpleGitTestContext;
   let git: SimpleGit;

   beforeEach(async () => context = await createTestContext());
   beforeEach(async () => {
      await initRepo(context);
      await context.files('aaa.txt', 'bbb.txt', 'ccc.other');
      git = newSimpleGit(context.root);
   });

   it('checkoutLocalBranch', async () => {
      const {current: initialBranch} = await git.status();

      expect(await promiseError(git.checkoutLocalBranch('my-new-branch'))).toBeUndefined();

      const {current: finalBranch} = await git.status();
      expect(finalBranch).toBe('my-new-branch');
      expect(finalBranch).not.toBe(initialBranch);
   });


});
