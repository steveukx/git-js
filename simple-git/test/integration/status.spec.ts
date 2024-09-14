import {
   createTestContext,
   like,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('status', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.file(['clean-dir', 'clean']);
      await context.file(['dirty-dir', 'dirty']);
      await setUpFilesAdded(context, ['alpha', 'beta'], ['alpha', 'beta', './clean-dir']);
   });

   it('detects renamed files', async () => {
      await context.git.raw('mv', 'alpha', 'gamma');
      const status = await context.git.status();

      expect(status).toEqual(
         like({
            files: [like({ path: 'gamma', from: 'alpha' }), like({ path: 'dirty-dir/dirty' })],
            renamed: [{ from: 'alpha', to: 'gamma' }],
         })
      );
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
      const status = await newSimpleGit(context.root).status({ '--': null, 'clean-dir': null });
      expect(status.isClean()).toBe(true);
   });

   it('dirty pathspec in options object', async () => {
      const status = await newSimpleGit(context.root).status({ '--': null, 'dirty-dir': null });
      expect(status.isClean()).toBe(false);
      expect(status.not_added).toEqual(['dirty-dir/dirty']);
   });

   it('detached head', async () => {
      const git = newSimpleGit(context.root);
      expect(await git.status()).toEqual(
         like({
            detached: false,
            current: expect.any(String),
         })
      );

      await git.raw('tag', 'v1');
      await git.raw('checkout', 'v1');

      expect(await git.status()).toEqual(
         like({
            current: 'HEAD',
            detached: true,
         })
      );
   });
});
