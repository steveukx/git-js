import {
   createTestContext,
   newSimpleGit,
   setUpInit,
   type SimpleGitTestContext,
} from '@simple-git/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

describe('constructor env', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.git.raw(['config', 'user.name', 'Fallback']);
      await context.git.raw(['config', 'user.email', 'fallback@test.local']);
   });

   it('passes allow-listed env supplied in the constructor options to the git child process', async () => {
      const git = newSimpleGit(context.root, {
         env: { GIT_AUTHOR_NAME: 'Env Test', GIT_AUTHOR_EMAIL: 'env@test.local' },
         allowEnvironment: ['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL'],
      });

      await git.raw(['commit', '--allow-empty', '-m', 'x']);
      const author = await git.raw(['log', '-1', '--format=%an <%ae>']);

      expect(author.trim()).toBe('Env Test <env@test.local>');
   });

   it('rejects guarded keys from the constructor env when they are not allow-listed', async () => {
      const git = newSimpleGit(context.root, {
         env: { GIT_AUTHOR_NAME: 'Env Test', GIT_AUTHOR_EMAIL: 'env@test.local' },
      });

      await expect(git.raw(['commit', '--allow-empty', '-m', 'x'])).rejects.toThrow(
         'Use of "GIT_AUTHOR_NAME" is blocked by the environment guard'
      );
   });
});
