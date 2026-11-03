import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: enabling the `ext::` remote helper by overriding `protocol.*.allow`.
 *
 * - CVE-2022-25912 `clone` with `-c protocol.ext.allow=always`
 * - CVE-2026-28292 / GHSA-r275-fr43-pm7q upper-case key `PROTOCOL.ALLOW=always` bypassed the check
 */
describe('advisories: protocol override', () => {
   const extUrl = (touch: string) => `ext::sh -c ${touch.replace(/ /g, '% ')}% >&2`;

   it.each([
      ['CVE-2022-25912', 'protocol.ext.allow=always'],
      ['CVE-2026-28292', 'PROTOCOL.ALLOW=always'],
      ['CVE-2026-28292', 'Protocol.Ext.Allow=always'],
   ])('blocks: %s clone with -c %s', async (_cve, config) => {
      const poc = await createAdvisoryContext();

      const err = await promiseError(
         poc.git().clone(extUrl(poc.touch), poc.context.path('dest'), ['-c', config])
      );

      assertGitError(err, 'allowUnsafeProtocolOverride');
      expect(poc.pwned()).toBe(false);
   });

   it('blocks: CVE-2026-28292 via the config option', async () => {
      const poc = await createAdvisoryContext();

      const err = await promiseError(
         poc
            .git({ config: ['PROTOCOL.ALLOW=always'] })
            .clone(extUrl(poc.touch), poc.context.path('dest'))
      );

      assertGitError(err, 'allowUnsafeProtocolOverride');
      expect(poc.pwned()).toBe(false);
   });

   it('control: executes when the key is in allowConfig', async () => {
      const poc = await createAdvisoryContext();

      await promiseError(
         poc
            .git({ allowConfig: ['protocol.allow'] })
            .clone(extUrl(poc.touch), poc.context.path('dest'), ['-c', 'PROTOCOL.ALLOW=always'])
      );

      expect(poc.pwned()).toBe(true);
   });
});
