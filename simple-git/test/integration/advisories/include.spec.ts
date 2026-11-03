import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: loading attacker-chosen configuration files.
 *
 * - CVE-2026-102826 / GHSA-g4wm-2vf7-vfgr `clone` customArgs with `-c include.path=...`
 *   and the `includeIf.<condition>.path` variant
 */
describe('advisories: config includes', () => {
   async function setUp() {
      const poc = await createAdvisoryContext();
      const source = await poc.source();
      const evil = await poc.context.file(
         'evil.gitconfig',
         `[core]\n\tfsmonitor = "${poc.touch}; false"\n`
      );
      return { poc, source, evil };
   }

   it.each([['include.path'], ['includeIf.gitdir:/**.path'], ['INCLUDE.PATH']])(
      'blocks: clone with -c %s',
      async (key) => {
         const { poc, source, evil } = await setUp();

         const err = await promiseError(poc.git().clone(source, 'dest', ['-c', `${key}=${evil}`]));

         assertGitError(err, 'allowUnsafeInclude');
         expect(poc.pwned()).toBe(false);
      }
   );

   it('control: executes when the key is in allowConfig', async () => {
      const { poc, source, evil } = await setUp();

      await promiseError(
         poc
            .git({ allowConfig: ['include.path'] })
            .clone(source, 'dest', ['-c', `include.path=${evil}`])
      );
      await promiseError(poc.git({ baseDir: poc.context.path('poc-workdir', 'dest') }).status());

      expect(poc.pwned()).toBe(true);
   });
});
