import { exists, FILE } from '@kwsites/file-exists';
import { createTestContext, newSimpleGit, setUpInit } from '@simple-git/test-utils';
import type { SimpleGitOptions } from 'simple-git';

/**
 * Shared set-up for the published security advisory regression tests. Each advisory is
 * covered by a `blocks` test proving the default configuration stops the attack, and a
 * `control` test proving the same payload really does execute when explicitly opted in,
 * so the `blocks` test can't silently pass because the payload stopped working.
 */
export async function createAdvisoryContext() {
   const context = await createTestContext();
   const root = await context.dir('poc-workdir');
   const sentinel = context.path('pwned');

   return {
      context,
      root,
      sentinel,

      /** Shell command that creates the sentinel file. */
      touch: `touch ${sentinel}`,

      /** Whether the attack payload has been executed */
      pwned: () => exists(sentinel, FILE),

      git(options: Partial<SimpleGitOptions> = {}) {
         return newSimpleGit(root, options);
      },

      /** Creates a repo with a single commit under the context root, returns its path. */
      async source(name = 'source') {
         const path = await context.dir(name);
         const git = newSimpleGit(path);
         await setUpInit({ git });
         await context.file([name, 'file.txt'], 'content');
         await git.add('file.txt');
         await git.commit('initial');
         return path;
      },

      /** Minimal environment for child processes when replacing the environment with `.env()` */
      env(extra: Record<string, string>) {
         return {
            PATH: process.env.PATH ?? '',
            HOME: context.root,
            ...extra,
         };
      },
   };
}
