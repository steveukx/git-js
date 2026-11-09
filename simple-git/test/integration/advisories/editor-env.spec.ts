import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: environment variables that name an editor for git to run.
 *
 * - CVE-2026-102829 / GHSA-v5rq-49vh-5v5c `VISUAL` was missing from the guarded environment
 */
describe('advisories: editor environment', () => {
   async function setUp() {
      const poc = await createAdvisoryContext();
      const source = await poc.source();
      return { poc, git: (options = {}) => poc.git({ baseDir: source, ...options }) };
   }

   it.each([['VISUAL'], ['EDITOR'], ['GIT_EDITOR']])(
      'blocks: %s supplied with .env()',
      async (name) => {
         const { poc, git } = await setUp();

         const err = await promiseError(
            git()
               .env(poc.env({ [name]: `${poc.touch};`, TERM: 'xterm' }))
               .raw('commit', '--amend')
         );

         assertGitError(err, 'allowUnsafeEditor');
         expect(poc.pwned()).toBe(false);
      }
   );

   it('control: executes when named in allowEnvironment', async () => {
      const { poc, git } = await setUp();

      await promiseError(
         git({ allowEnvironment: ['VISUAL'] })
            // git ignores VISUAL on a dumb (or unset) terminal
            .env(poc.env({ VISUAL: `${poc.touch};`, TERM: 'xterm' }))
            .raw('commit', '--amend')
      );

      expect(poc.pwned()).toBe(true);
   });
});
