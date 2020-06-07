const {createTestContext} = require('../helpers');

describe('branches', () => {

   let context, git;

   function file (name, dir = 'src', content = 'file content') {
      return context.fileP(dir, name, content);
   }

   beforeEach(async () => {
      context = createTestContext();
      git = context.git(context.root);

      await git.raw('init');
      await file('in-master');
      await git.raw('add', 'src/');
      await git.raw('commit', '-m', 'master commit');
      await git.raw('branch', '-c', 'master', 'alpha');
      await git.raw('checkout', '-b', 'beta');
      await file('in-beta');
      await git.raw('add', 'src/');
      await git.raw('commit', '-m', 'beta commit');
      await git.raw('checkout', 'master');
   });

   it('reports the current branch detail', async () => {
      let actual = await context.gitP(context.root).branch();
      expect(actual).toEqual(expect.objectContaining({
         all: ['alpha', 'beta', 'master'],
         current: 'master',
      }));
      expect(actual.branches.master.commit).toBe(actual.branches.alpha.commit);
      expect(actual.branches.master.commit).not.toBe(actual.branches.beta.commit);
   });

   it('rejects non-force deleting unmerged branches', async () => {
      let rejection = null;
      const branchDeletion = await context.gitP(context.root)
         .deleteLocalBranch('beta')
         .catch(err => (rejection = err).git);

      expect(rejection).not.toBeNull();
      expect(rejection.message).toMatch('git branch -D');
      expect(branchDeletion.success).toBe(false);
   });

   it(`force delete branch using the generic 'branch'`, async () => {
      const deletion = await context.gitP(context.root).branch(['-D', 'beta']);
      expect(deletion).toEqual(expect.objectContaining({
         success: true,
         branch: 'beta',
      }));
   });

   it('force deletes multiple branches', async () => {
      const deletion = await context.gitP(context.root).deleteLocalBranches(['beta', 'alpha'], true);
      expect(deletion).toEqual(expect.objectContaining({
         success: true,
      }));
      expect(deletion.branches.alpha).toEqual(expect.objectContaining({ success: true }));
      expect(deletion.branches.beta).toEqual(expect.objectContaining({ success: true }));
   });

   it('deletes multiple branches', async () => {
      const deletion = await context.gitP(context.root).deleteLocalBranches(['alpha', 'beta']);

      expect(deletion).toEqual(expect.objectContaining({
         success: false,
      }));
      expect(deletion.errors).toEqual([deletion.branches.beta]);
      expect(deletion.branches.alpha).toEqual(expect.objectContaining({success: true}));
      expect(deletion.branches.beta).toEqual(expect.objectContaining({success: false}));
   });

});
