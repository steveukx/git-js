import { promiseError } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit } from '@simple-git/test-utils';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

/**
 * Configuration keys ending in `.cmd` or `command` that aren't explicitly identified as unsafe are
 * caught by the catch-all `allowUnsafeCommandBinaries` rules, enforced only once the recommended
 * checks are enabled with `unsafe.recommended` (or implied by `strictConfig`).
 */
describe('recommended catch-all config', () => {
   let emitWarning: MockInstance<typeof process.emitWarning>;

   beforeEach(() => {
      emitWarning = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
   });
   afterEach(() => emitWarning.mockRestore());

   async function setUp() {
      const context = await createTestContext();
      const root = await context.dir('poc-workdir');
      await newSimpleGit(root).init();

      return {
         root,
         read: async (key: string) => (await newSimpleGit(root).getConfig(key, 'local')).value,
      };
   }

   it.each([['foo.bar.cmd'], ['foo.bar.command']])('allows: writing %s by default', async (key) => {
      const { root, read } = await setUp();

      await newSimpleGit(root).addConfig(key, '/custom/path');

      expect(await read(key)).toBe('/custom/path');
   });

   it.each([['foo.bar.cmd'], ['foo.bar.command']])(
      'blocks: writing %s with unsafe.recommended',
      async (key) => {
         const { root, read } = await setUp();

         assertGitError(
            await promiseError(
               newSimpleGit(root, { unsafe: { recommended: true } }).addConfig(key, '/custom/path')
            ),
            'allowUnsafeCommandBinaries'
         );

         expect(await read(key)).toBeNull();
      }
   );
});
