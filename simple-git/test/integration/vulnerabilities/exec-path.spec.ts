import { chmod } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseError } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit } from '@simple-git/test-utils';

describe('--exec-path', () => {
   it('blocks: global flag without being allowed', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = context.path('new-exec-path-pwned');

      await newSimpleGit(root).init();

      // `git` loads the remote helper for a url's scheme out of its exec-path, so an
      // attacker-named directory containing `git-remote-https` is arbitrary execution
      const execPath = await context.dir('evil-exec-path');
      const helper = await context.file(
         ['evil-exec-path', 'git-remote-https'],
         `#!/bin/sh\ntouch ${pwnd}\nexit 1\n`
      );
      await chmod(helper, 0o755);

      const err = await promiseError(
         newSimpleGit(root).raw(
            `--exec-path=${execPath}`,
            'ls-remote',
            'https://example.com/repo.git'
         )
      );

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafeExec');
   });
});
