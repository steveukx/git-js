import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { ResetMode } from '../../src/lib/tasks/reset';

describe('reset', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await setUpFilesAdded(context, ['alpha', 'beta', 'gamma'], 'alpha');
   });

   it('resets adding a single file', async () => {
      const git = newSimpleGit(context.root);
      expect((await git.status()).not_added).toEqual(['beta', 'gamma']);

      await git.add('.');
      expect((await git.status()).not_added).toEqual([]);

      await git.reset(['--', 'beta']);
      expect((await git.status()).not_added).toEqual(['beta']);
   });

   it('throws when hard resetting a path', async () => {
      const git = newSimpleGit(context.root);
      await git.add('.');
      const error = await promiseError(git.reset(ResetMode.HARD, ['--', 'beta']));

      assertGitError(error, /hard reset/);
   });
});
