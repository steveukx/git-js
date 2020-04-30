const Test = require('./include/runner');

describe('branches', () => {

   let context;

   function git (...commands) {
      return context.gitP(context.root).raw(commands);
   }

   function file (name, dir = 'src', content = 'file content') {
      return Promise.resolve(context.file(dir, name, content));
   }

   beforeEach(async () => {
      context = Test.createContext();

      await git('init');
      await file('in-master');
      await git('add', 'src/');
      await git('commit', '-m', 'master commit');
      await git('branch', '-c', 'master', 'alpha');
      await git('checkout', '-b', 'beta');
      await file('in-beta');
      await git('add', 'src/');
      await git('commit', '-m', 'beta commit');
      await git('checkout', 'master');
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
      try {
         await context.gitP(context.root).deleteLocalBranch('beta');
      }
      catch (e) {
         return expect(e.message).toMatch('git branch -D');
      }

      throw new Error('Unmerged branches cannot be deleted by default');
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
