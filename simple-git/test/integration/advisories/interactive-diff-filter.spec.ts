import { promiseError } from '@kwsites/promise-result';
import { assertGitError, setUpInit } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: `interactive.diffFilter` is a shell command that `git add -p` (and the other `--patch`
 * commands) pipes its coloured diff through. It runs before the first prompt, so runs even when
 * there is no terminal to answer it.
 *
 * `git add -p` then waits on stdin, so the `timeout` option ends the process once it has been idle.
 */
describe('advisories: interactive diff filter', () => {
   async function setUp() {
      const poc = await createAdvisoryContext();
      const git = poc.git();
      await setUpInit({ git });
      await poc.context.file(['poc-workdir', 'file.txt'], 'one\n');
      await git.add('file.txt');
      await git.commit('initial');
      await poc.context.file(['poc-workdir', 'file.txt'], 'two\n');
      return poc;
   }

   function addPatch(poc: Awaited<ReturnType<typeof setUp>>, options = {}) {
      return poc
         .git({
            config: ['color.ui=always', `interactive.diffFilter=${poc.touch}; cat`],
            timeout: { block: 1000 },
            ...options,
         })
         .raw('add', '-p');
   }

   it('blocks: config option interactive.diffFilter', async () => {
      const poc = await setUp();

      assertGitError(await promiseError(addPatch(poc)), 'allowUnsafePager');
      expect(poc.pwned()).toBe(false);
   });

   it('control: executes when the key is in allowConfig', async () => {
      const poc = await setUp();

      await promiseError(addPatch(poc, { allowConfig: ['interactive.diffFilter'] }));
      expect(poc.pwned()).toBe(true);
   });

   it('control: executes with allowUnsafePager', async () => {
      const poc = await setUp();

      await promiseError(addPatch(poc, { unsafe: { allowUnsafePager: true } }));
      expect(poc.pwned()).toBe(true);
   });
});
