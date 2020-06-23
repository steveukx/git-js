const {createTestContext, setUpFilesAdded, setUpInit} = require('../helpers');

describe('status', () => {

   let context, git;

   beforeEach(() => context = createTestContext());
   beforeEach(async () => {
      await context.fileP('clean-dir', 'file', 'content');
      await setUpInit(context);
      await setUpFilesAdded(context, ['alpha', 'beta']);
      await context.fileP('dirty-dir', 'file', 'content');
   });
   beforeEach(() => {
      git = context.git(context.root);
   });

   it('whole repo status', async () => {
      await assertStatus(git.status(), ['dirty-dir/file']);
   });

   it('clean pathspec in options array', async () => {
      await assertStatus(git.status(['--', 'clean-dir']), []);
   });

   it('dirty pathspec in options array', async () => {
      await assertStatus(git.status(['--', 'dirty-dir']), ['dirty-dir/file']);
   });

   it('clean pathspec in options object', async () => {
      await assertStatus(git.status({'--': null, 'clean-dir': null}), []);
   });

   it('dirty pathspec in options object', async () => {
      await assertStatus(git.status({'--': null, 'dirty-dir': null}), ['dirty-dir/file']);
   });

   async function assertStatus (status, notAdded = []) {
      const result = await status;
      expect(result.isClean()).toBe(!notAdded.length);
      expect(result.files).toHaveLength(notAdded.length);
      expect(result.not_added).toEqual(notAdded);
   }

});
