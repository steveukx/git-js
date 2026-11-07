import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: configuration keys that name a command for git to run.
 *
 * - CVE-2026-102828 / GHSA-x6jw-m9v5-85vh `trailer.<token>.cmd` was missing from the block list
 *
 * Under `strictConfig` any key that isn't in the built-in safe list is blocked, so keys like
 * this one that are added to git in future are blocked without needing a new block-list entry.
 */
describe('advisories: command binaries', () => {
   async function setUp() {
      const poc = await createAdvisoryContext();
      await poc.git().init();
      const message = await poc.context.file(['poc-workdir', 'message.txt'], 'subject\n');
      return { poc, message };
   }

   it.each([['trailer.audit.cmd'], ['trailer.audit.command'], ['TRAILER.Audit.CMD']])(
      'blocks: config option %s',
      async (key) => {
         const { poc, message } = await setUp();

         const err = await promiseError(
            poc
               .git({ config: [`${key}=${poc.touch};`] })
               .raw('interpret-trailers', '--trailer', 'audit:value', message)
         );

         assertGitError(err, 'allowUnsafeCommandBinaries');
         expect(poc.pwned()).toBe(false);
      }
   );

   it('blocks: unlisted key under strictConfig', async () => {
      const { poc, message } = await setUp();

      const err = await promiseError(
         poc
            .git({ strictConfig: true, unsafe: { allowUnsafeCommandBinaries: false } })
            .raw('-c', `trailer.audit.ifexists=add`, 'interpret-trailers', message)
      );

      assertGitError(err, 'allowConfig');
   });

   it('control: executes when the key is in allowConfig', async () => {
      const { poc, message } = await setUp();

      await promiseError(
         poc
            .git({ config: [`trailer.audit.cmd=${poc.touch};`], allowConfig: ['trailer.*.cmd'] })
            .raw('interpret-trailers', '--trailer', 'audit:value', message)
      );

      expect(poc.pwned()).toBe(true);
   });
});
