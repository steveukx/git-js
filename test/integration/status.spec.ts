import { createTestContext, newSimpleGit, setUpFilesAdded, setUpInit, SimpleGitTestContext } from '../__fixtures__';

describe('status', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());
   beforeEach(async () => {
      await setUpInit(context);
      await context.file(['clean-dir', 'clean']);
      await context.file(['dirty-dir', 'dirty']);
      await setUpFilesAdded(context, ['alpha', 'beta'], ['alpha', 'beta', './clean-dir']);
   });

   it('whole repo status', async () => {
      const status = await newSimpleGit(context.root).status();
      expect(status).toHaveProperty('not_added', ['dirty-dir/dirty']);
   });

   it('clean pathspec in options array', async () => {
      const status = await newSimpleGit(context.root).status(['--', 'clean-dir']);
      expect(status.isClean()).toBe(true);
      expect(status.files).toEqual([]);
   });

   it('dirty pathspec in options array', async () => {
      const status = await newSimpleGit(context.root).status(['--', 'dirty-dir']);
      expect(status.isClean()).toBe(false);
      expect(status.not_added).toEqual(['dirty-dir/dirty']);
   });

   it('clean pathspec in options object', async () => {
      const status = await newSimpleGit(context.root).status({'--': null, 'clean-dir': null});
      expect(status.isClean()).toBe(true);
   });

   it('dirty pathspec in options object', async () => {
      const status = await newSimpleGit(context.root).status({'--': null, 'dirty-dir': null});
      expect(status.isClean()).toBe(false);
      expect(status.not_added).toEqual(['dirty-dir/dirty']);
   });

});
