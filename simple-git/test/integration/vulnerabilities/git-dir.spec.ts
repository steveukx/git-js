import { chmod, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
} from '@simple-git/test-utils';

/**
 * Plants a repo skeleton at `dir` whose config runs `payload` whenever git opens an
 * ssh connection, rewriting `https://` urls to ssh so that a url supplied by the
 * application itself is enough to reach it. Note the config is plain text with no
 * execute bit - only the directory name needs to be attacker controlled.
 */
async function plantRepo(context: SimpleGitTestContext, dir: string[], payload: string) {
   const gitDir = await context.dir(...dir);

   await writeFile(
      context.path(...dir, 'config'),
      `[core]\n\tsshCommand = ${payload}\n[url "ssh://x.invalid/"]\n\tinsteadOf = https://\n`
   );
   await writeFile(context.path(...dir, 'HEAD'), 'ref: refs/heads/main\n');
   await context.dir(...dir, 'objects');
   await context.dir(...dir, 'refs');

   return gitDir;
}

async function plantPayload(context: SimpleGitTestContext, pwnd: string) {
   const payload = await context.file('payload.sh', `#!/bin/sh\ntouch ${pwnd}\nexit 1\n`);
   await chmod(payload, 0o755);

   return payload;
}

describe('config through a path-taking global flag', () => {
   it('allows: --git-dir when used as a getter', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = context.path('new-git-dir-pwned');

      await newSimpleGit(root).init();
      await plantRepo(context, ['evil-git-dir'], await plantPayload(context, pwnd));

      const err = await promiseError(newSimpleGit(root).raw('rev-parse', `--git-dir`));

      expect(exists(pwnd, FILE)).toBe(false);

      expect(err).toBe(undefined);
   });

   it('blocks: --git-dir at an attacker-named directory', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = context.path('new-git-dir-pwned');

      await newSimpleGit(root).init();
      const gitDir = await plantRepo(context, ['evil-git-dir'], await plantPayload(context, pwnd));

      const err = await promiseError(
         newSimpleGit(root).raw(`--git-dir=${gitDir}`, 'ls-remote', 'https://example.com/repo.git')
      );

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafeConfigPaths');
   });

   it('blocks: --git-dir supplied as a separate token', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = context.path('new-git-dir-pwned');

      await newSimpleGit(root).init();
      const gitDir = await plantRepo(context, ['evil-git-dir'], await plantPayload(context, pwnd));

      const err = await promiseError(
         newSimpleGit(root).raw('--git-dir', gitDir, 'ls-remote', 'https://example.com/repo.git')
      );

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafeConfigPaths');
   });

   it('blocks: -C into a directory holding a planted repo', async () => {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      const pwnd = context.path('new-change-dir-pwned');

      await newSimpleGit(root).init();
      await plantRepo(context, ['evil-work-dir', '.git'], await plantPayload(context, pwnd));

      const err = await promiseError(
         newSimpleGit(root).raw(
            '-C',
            context.path('evil-work-dir'),
            'ls-remote',
            'https://example.com/repo.git'
         )
      );

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafeConfigPaths');
   });
});
