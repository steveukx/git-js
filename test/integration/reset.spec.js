const {assertGitError, catchAsync, createTestContext, setUpFilesAdded, setUpGitIgnore, setUpInit} = require('../helpers');

const {ResetMode} = require('../..');

describe('reset', () => {

   let context;

   beforeEach(() => context = createTestContext());
   beforeEach(async () => {
      await setUpInit(context);
      await setUpFilesAdded(context, ['alpha', 'beta', 'gamma'], 'alpha');
   });

   it('resets adding a single file', async () => {
      const git = context.git(context.root);
      expect((await git.status()).not_added).toEqual(['beta', 'gamma']);

      await git.add('.');
      expect((await git.status()).not_added).toEqual([]);

      await git.reset(['--', 'beta'])
      expect((await git.status()).not_added).toEqual(['beta']);
   });

   it('throws when hard resetting a path', async () => {
      const git = context.git(context.root);
      await git.add('.');
      const {error} = await catchAsync(git.reset(ResetMode.HARD, ['--', 'beta']));

      assertGitError(error, /hard reset/);
   });

});
