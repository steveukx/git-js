import { chmod } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
} from '@simple-git/test-utils';

async function setUpRepo(context: SimpleGitTestContext) {
   const root = await context.dir('poc-workdir');

   await newSimpleGit(root).init();
   await context.file(['poc-workdir', 'file.txt'], 'needle\n');
   await newSimpleGit(root).add('file.txt');

   return root;
}

async function plantPayload(context: SimpleGitTestContext, pwnd: string) {
   const payload = await context.file('payload.sh', `#!/bin/sh\ntouch ${pwnd}\n`);
   await chmod(payload, 0o755);

   return payload;
}

describe('grep --open-files-in-pager', () => {
   it('blocks: --open-files-in-pager without being allowed', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);
      const pwnd = context.path('new-open-files-in-pager-pwned');
      const payload = await plantPayload(context, pwnd);

      const err = await promiseError(
         newSimpleGit(root).raw('grep', `--open-files-in-pager=${payload}`, 'needle')
      );

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafePager');
   });

   it('blocks: -O without being allowed', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);
      const pwnd = context.path('new-open-files-in-pager-pwned');
      const payload = await plantPayload(context, pwnd);

      const err = await promiseError(newSimpleGit(root).raw('grep', `-O${payload}`, 'needle'));

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafePager');
   });

   it('blocks: -O clustered with other short switches', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);
      const pwnd = context.path('new-open-files-in-pager-pwned');
      const payload = await plantPayload(context, pwnd);

      const err = await promiseError(newSimpleGit(root).raw('grep', `-iO${payload}`, 'needle'));

      expect(exists(pwnd, FILE)).toBe(false);

      assertGitError(err, 'allowUnsafePager');
   });

   it('allows: -o as --only-matching rather than -O', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);

      const err = await promiseError(newSimpleGit(root).raw('grep', '-o', 'needle'));

      expect(err).toBe(undefined);
   });

   it('allows: -O without a value, opening files in the configured pager', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);
      const pwnd = context.path('new-open-files-in-pager-pwned');
      const payload = await plantPayload(context, pwnd);

      // customise pager to be non-blocking process
      await newSimpleGit(root, { unsafe: { allowUnsafePager: true } }).addConfig(
         'core.pager',
         payload
      );

      // allow using the default pager
      const err = await promiseError(newSimpleGit(root).raw('grep', '-O', 'needle'));

      expect(exists(pwnd, FILE)).toBe(true);

      expect(err).toBe(undefined);
   });

   it('allows: --open-files-in-pager when enabled with allowUnsafePager', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);
      const pwnd = context.path('new-open-files-in-pager-pwned');
      const payload = await plantPayload(context, pwnd);

      const err = await promiseError(
         newSimpleGit(root, { unsafe: { allowUnsafePager: true } }).raw(
            'grep',
            `--open-files-in-pager=${payload}`,
            'needle'
         )
      );

      expect(exists(pwnd, FILE)).toBe(true);

      expect(err).toBe(undefined);
   });

   it('allows: -O when enabled with allowUnsafePager', async () => {
      const context = await createTestContext();
      const root = await setUpRepo(context);
      const pwnd = context.path('new-open-files-in-pager-pwned');
      const payload = await plantPayload(context, pwnd);

      const err = await promiseError(
         newSimpleGit(root, { unsafe: { allowUnsafePager: true } }).raw(
            'grep',
            `-O${payload}`,
            'needle'
         )
      );

      expect(exists(pwnd, FILE)).toBe(true);

      expect(err).toBe(undefined);
   });
});
