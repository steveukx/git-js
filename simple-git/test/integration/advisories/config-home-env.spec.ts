import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: environment variables that choose where `git` reads its global configuration from.
 *
 * `git` reads `$HOME/.gitconfig` and `$XDG_CONFIG_HOME/git/config` as global configuration, so naming
 * a directory that holds a malicious configuration file is equivalent to `GIT_CONFIG_GLOBAL`.
 */
describe('advisories: global config location', () => {
   async function setUp(variable: 'HOME' | 'XDG_CONFIG_HOME') {
      const poc = await createAdvisoryContext();
      await poc.git().init();

      const config = `[core]\n\tfsmonitor = "${poc.touch}; false"\n`;
      const dir = await poc.context.dir('evil-config');
      if (variable === 'HOME') {
         await poc.context.file(['evil-config', '.gitconfig'], config);
      } else {
         await poc.context.dir('evil-config', 'git');
         await poc.context.file(['evil-config', 'git', 'config'], config);
      }

      return { poc, dir };
   }

   it.each([['HOME' as const], ['XDG_CONFIG_HOME' as const]])('blocks: %s', async (variable) => {
      const { poc, dir } = await setUp(variable);

      const err = await promiseError(
         poc
            .git()
            .env({ PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', [variable]: dir })
            .status()
      );

      assertGitError(err, 'allowUnsafeConfigPaths');
      expect(poc.pwned()).toBe(false);
   });

   it('permits: the inherited HOME passed through .env()', async () => {
      const { poc } = await setUp('HOME');

      expect(
         await promiseError(
            poc
               .git()
               .env({ PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' })
               .status()
         )
      ).toBeUndefined();
   });

   it.each([['HOME' as const], ['XDG_CONFIG_HOME' as const]])(
      'control: %s executes when named in allowEnvironment',
      async (variable) => {
         const { poc, dir } = await setUp(variable);

         await promiseError(
            poc
               .git({ allowEnvironment: [variable] })
               .env({ PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', [variable]: dir })
               .status()
         );

         expect(poc.pwned()).toBe(true);
      }
   );
});
