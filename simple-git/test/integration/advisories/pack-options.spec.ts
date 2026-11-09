import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: custom upload / receive pack binaries supplied as task options.
 *
 * - CVE-2022-24433 `fetch` with `--upload-pack`
 * - CVE-2022-24066 incomplete fix of CVE-2022-24433
 * - CVE-2022-25860 `clone` / `pull` / `push` with `-u`, `--upload-pack` or `--receive-pack`
 * - CVE-2026-28291 / GHSA-jcxm-m3jx-f287 option parsing bypass with combined short flags (`-vu`)
 * - CVE-2026-102827 / GHSA-858h-whjf-mvg5 abbreviated long options (`--receive-p`, `--upload-p`)
 */
describe('advisories: pack options', () => {
   describe('CVE-2022-24433 / CVE-2022-24066: fetch --upload-pack', () => {
      it.each([
         ['options object', (touch: string) => [{ '--upload-pack': touch }]],
         ['options array', (touch: string) => [[`--upload-pack=${touch}`]]],
      ])('blocks: %s', async (_name, args) => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         await poc.git().clone(source, '.');

         const err = await promiseError(
            poc.git().fetch('origin', 'main', ...(args(`${poc.touch};`) as [any]))
         );

         // `git.fetch` has its own unconditional block on `--upload-pack`
         expect(err).toBeDefined();
         expect(poc.pwned()).toBe(false);
      });

      it('blocks: raw fetch --upload-pack', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         await poc.git().clone(source, '.');

         const err = await promiseError(
            poc.git().raw('fetch', `--upload-pack=${poc.touch};`, 'origin')
         );

         assertGitError(err, 'allowUnsafePack');
         expect(poc.pwned()).toBe(false);
      });

      it('control: executes when allowUnsafePack is enabled', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         await poc.git().clone(source, '.');

         await promiseError(
            poc
               .git({ unsafe: { allowUnsafePack: true } })
               .raw('fetch', `--upload-pack=${poc.touch};`, 'origin')
         );

         expect(poc.pwned()).toBe(true);
      });
   });

   describe('CVE-2022-25860: clone / pull / push', () => {
      it.each([
         ['clone -u', ['-u', 'TOUCH;']],
         ['clone --upload-pack', ['--upload-pack=TOUCH;']],
      ])('blocks: %s', async (_name, options) => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         const args = options.map((o) => o.replace('TOUCH', poc.touch));

         const err = await promiseError(poc.git().clone(source, 'dest', args));

         assertGitError(err, 'allowUnsafePack');
         expect(poc.pwned()).toBe(false);
      });

      it('blocks: pull --upload-pack', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         await poc.git().clone(source, '.');

         const err = await promiseError(
            poc.git().pull('origin', 'main', { '--upload-pack': `${poc.touch};` })
         );

         assertGitError(err, 'allowUnsafePack');
         expect(poc.pwned()).toBe(false);
      });

      it('blocks: push --receive-pack', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         await poc.git().clone(source, '.');

         const err = await promiseError(
            poc.git().push('origin', 'HEAD:refs/heads/pwn', [`--receive-pack=${poc.touch};`])
         );

         assertGitError(err, 'allowUnsafePack');
         expect(poc.pwned()).toBe(false);
      });

      it('control: clone -u executes when allowUnsafePack is enabled', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();

         await promiseError(
            poc
               .git({ unsafe: { allowUnsafePack: true } })
               .clone(source, 'dest', ['-u', `${poc.touch};`])
         );

         expect(poc.pwned()).toBe(true);
      });
   });

   describe('CVE-2026-28291: combined short options', () => {
      it.each([[['-vu', 'TOUCH;']], [['-qu', 'TOUCH;']], [['-vqu', 'TOUCH;']]])(
         'blocks: clone %j',
         async (options) => {
            const poc = await createAdvisoryContext();
            const source = await poc.source();
            const args = options.map((o) => o.replace('TOUCH', poc.touch));

            const err = await promiseError(poc.git().clone(source, 'dest', args));

            assertGitError(err, 'allowUnsafePack');
            expect(poc.pwned()).toBe(false);
         }
      );
   });

   describe('CVE-2026-102827: abbreviated long options', () => {
      it('blocks: push --receive-p', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();
         await poc.git().clone(source, '.');

         const err = await promiseError(
            poc.git().push(['origin', 'HEAD:refs/heads/pwn', `--receive-p=${poc.touch};`])
         );

         expect(err).toBeDefined();
         expect(poc.pwned()).toBe(false);
      });

      it('blocks: clone --upload-p', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();

         const err = await promiseError(
            poc.git().clone(source, 'dest', [`--upload-p=${poc.touch};`])
         );

         expect(err).toBeDefined();
         expect(poc.pwned()).toBe(false);
      });

      it('control: executes when abbreviations and pack overrides are both enabled', async () => {
         const poc = await createAdvisoryContext();
         const source = await poc.source();

         await promiseError(
            poc
               .git({ unsafe: { allowUnsafePack: true, allowAbbreviatedOptions: true } })
               .clone(source, 'dest', [`--upload-p=${poc.touch};`])
         );

         expect(poc.pwned()).toBe(true);
      });
   });
});
