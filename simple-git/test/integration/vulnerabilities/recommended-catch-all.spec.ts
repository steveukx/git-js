import { promiseError } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit } from '@simple-git/test-utils';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import type { SimpleGitOptions } from '../../../src/typings';

/**
 * Configuration keys ending in `.cmd` or `command` that aren't explicitly identified as unsafe are
 * caught by the catch-all `allowUnsafeCommandBinaries` rules, enforced only once the recommended
 * checks are enabled with `unsafe.recommended` (or implied by `strict`).
 *
 * Overriding `HOME` through `.env()` is similarly only blocked once the recommended checks are enabled.
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
         context,
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

   describe('overriding HOME', () => {
      async function setUpHome() {
         const { context, root } = await setUp();
         const home = await context.dir('custom-home');

         return {
            run: (options: Partial<SimpleGitOptions> = {}) =>
               newSimpleGit(root, options)
                  .env({ PATH: process.env.PATH ?? '', HOME: home })
                  .status(),
         };
      }

      it('allows: overriding HOME by default', async () => {
         const { run } = await setUpHome();

         expect(await promiseError(run())).toBeUndefined();
      });

      it('blocks: overriding HOME with unsafe.recommended', async () => {
         const { run } = await setUpHome();

         assertGitError(
            await promiseError(run({ unsafe: { recommended: true } })),
            'allowUnsafeConfigPaths'
         );
      });

      it('blocks: overriding HOME with strict', async () => {
         const { run } = await setUpHome();

         assertGitError(await promiseError(run({ strict: true })), 'allowUnsafeConfigPaths');
      });

      it('allows: overriding HOME with unsafe.recommended when named in allowEnvironment', async () => {
         const { run } = await setUpHome();

         expect(
            await promiseError(run({ unsafe: { recommended: true }, allowEnvironment: ['HOME'] }))
         ).toBeUndefined();
      });
   });
});
