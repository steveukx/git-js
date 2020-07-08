const {assertGitError, createTestContext, promiseError} = require('../helpers');
const {GitConstructError} = require('../../src/lib/api');

describe('bad initial path', () => {

   let context;
   beforeEach(() => context = createTestContext());

   it('simple-git/promise', async () => {
      const root = context.dirPath('foo');
      const git = context.gitP(root);

      const errorInstance = await promiseError(git.init());
      assertGitError(errorInstance, `does not exist`, GitConstructError);
      expect(errorInstance.config).toEqual(expect.objectContaining({
         baseDir: root,
      }));
   });

   it('simple-git', async () => {
      const root = context.dirPath('foo');
      let errorInstance;
      try {
         context.git(root);
      } catch (e) {
         errorInstance = e;
      }

      assertGitError(errorInstance, `does not exist`, GitConstructError);
      expect(errorInstance.config).toEqual(expect.objectContaining({
         baseDir: root,
      }));
   });

});
