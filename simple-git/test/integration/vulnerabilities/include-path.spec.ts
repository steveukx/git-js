import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseError } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit } from '@simple-git/test-utils';

describe('include.path', () => {
   it('blocks: inline config without being allowed', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = join(context.root, `new-include-path-pwned`);

      await newSimpleGit(root).init();
      const configFile = await context.file(
         ['poc-workdir', 'evil.gitconfig'],
         `[core]\n\tfsmonitor = touch ${pwnd}\n`
      );
      assertGitError(
         await promiseError(newSimpleGit(root).raw('-c', `include.path=${configFile}`, 'status')),
         'allowUnsafeInclude'
      );

      expect(exists(pwnd, FILE)).toBe(false);
   });

   it('pwns: inline config explicit opt-in', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = join(context.root, `new-include-path-pwned`);

      await newSimpleGit(root).init();
      const configFile = await context.file(
         ['poc-workdir', 'evil.gitconfig'],
         `[core]\n\tfsmonitor = touch ${pwnd}\n`
      );
      await promiseError(
         newSimpleGit(root, { unsafe: { allowUnsafeInclude: true } }).raw(
            '-c',
            `include.path=${configFile}`,
            'status'
         )
      );
      expect(exists(pwnd, FILE)).toBe(true);
   });
});
