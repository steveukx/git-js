import { promiseResult } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   like,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('branches', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      const { file, git } = context;
      await setUpInit(context);
      await file('in-master');
      await git.raw('add', 'in-master');
      await git.raw('commit', '-m', 'master commit');
      await git.raw('branch', '-c', 'master', 'alpha');
      await git.raw('checkout', '-b', 'beta');
      await file('in-beta');
      await git.raw('add', 'in-beta');
      await git.raw('commit', '-m', 'beta commit');
      await git.raw('checkout', 'master');
   });

   it('reports the current branch detail', async () => {
      const git = newSimpleGit(context.root);
      let actual = await git.branch();
      expect(actual).toEqual(
         like({
            all: ['alpha', 'beta', 'master'],
            current: 'master',
         })
      );
      expect(actual.branches.master.commit).toBe(actual.branches.alpha.commit);
      expect(actual.branches.master.commit).not.toBe(actual.branches.beta.commit);
   });

   it('rejects non-force deleting unmerged branches', async () => {
      const branchDeletion = await promiseResult(
         newSimpleGit(context.root).deleteLocalBranch('beta')
      );

      assertGitError(branchDeletion.result, /git branch -D/);
      expect(branchDeletion.success).toBe(false);
   });

   it(`force delete branch using the generic 'branch'`, async () => {
      const deletion = await newSimpleGit(context.root).branch(['-D', 'beta']);
      expect(deletion).toEqual(
         like({
            success: true,
            branch: 'beta',
         })
      );
   });

   it('force deletes multiple branches', async () => {
      const deletion = await newSimpleGit(context.root).deleteLocalBranches(
         ['beta', 'alpha'],
         true
      );
      expect(deletion).toEqual(
         like({
            success: true,
         })
      );
      expect(deletion.branches.alpha).toEqual(like({ success: true }));
      expect(deletion.branches.beta).toEqual(like({ success: true }));
   });

   it('deletes multiple branches', async () => {
      const deletion = await newSimpleGit(context.root).deleteLocalBranches(['alpha', 'beta']);

      expect(deletion).toEqual(
         like({
            success: false,
         })
      );
      expect(deletion.errors).toEqual([deletion.branches.beta]);
      expect(deletion.branches.alpha).toEqual(like({ success: true }));
      expect(deletion.branches.beta).toEqual(like({ success: false }));
   });
});
