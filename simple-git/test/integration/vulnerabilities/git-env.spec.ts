import { describe, expect, it } from 'vitest';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseError } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit, setUpInit } from '@simple-git/test-utils';

describe('--exec-path', () => {
   it('blocks: use of VISUAL blocked by default', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = context.path('new-exec-path-pwned');

      await setUpInit({ git: newSimpleGit(root) });
      await context.file(['poc-workdir', 'file']);
      await newSimpleGit(root).raw('add', '.');
      await newSimpleGit(root).raw('commit', '-m', 'foo');

      const err = await promiseError(
         newSimpleGit(root)
            .env({ VISUAL: `touch ${pwnd}` })
            .raw('commit', '--ammend')
      );

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafeEditor');
   });
});
