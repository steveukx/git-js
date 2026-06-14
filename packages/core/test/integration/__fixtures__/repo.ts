import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createGit, type GitExecutor } from '@simple-git/core';

export interface TempRepo {
   dir: string;
   git: GitExecutor;
   write(file: string, content: string | Buffer): void;
   gitRaw(...args: string[]): string;
   cleanup(): void;
}

/**
 * Creates an isolated git repository in a temp directory with a local identity
 * set out-of-band (via real git, not the executor), so integration tests do not
 * depend on ambient `GIT_*`/global config that the deny-by-default model strips.
 */
export function createTempRepo(options: Parameters<typeof createGit>[0] = {}): TempRepo {
   const dir = mkdtempSync(join(tmpdir(), 'sg-core-'));
   const gitRaw = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });

   gitRaw('init', '-b', 'main');
   gitRaw('config', 'user.email', 'test@example.com');
   gitRaw('config', 'user.name', 'Test User');
   gitRaw('config', 'commit.gpgsign', 'false');

   return {
      dir,
      git: createGit({ baseDir: dir, ...options }),
      write(file, content) {
         writeFileSync(join(dir, file), content);
      },
      gitRaw,
      cleanup() {
         rmSync(dir, { recursive: true, force: true });
      },
   };
}
