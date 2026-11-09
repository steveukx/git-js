import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: `git filter-branch` runs the value of `--setup` and each `--<type>-filter` option through
 * `eval`, the same class of command execution as `git rebase -x`.
 *
 * `FILTER_BRANCH_SQUELCH_WARNING` skips the pause `git filter-branch` adds to warn about its use.
 */
describe('advisories: filter-branch', () => {
   async function setUp() {
      const poc = await createAdvisoryContext();
      await poc.source('poc-workdir');
      return poc;
   }

   function filterBranch(
      poc: Awaited<ReturnType<typeof setUp>>,
      flag: string,
      unsafe: { allowUnsafeExec?: boolean } = {}
   ) {
      return poc
         .git({ unsafe })
         .env(poc.env({ FILTER_BRANCH_SQUELCH_WARNING: '1' }))
         .raw('filter-branch', '-f', flag, `${poc.touch}`, '--', '--all');
   }

   it.each([
      ['--setup'],
      ['--env-filter'],
      ['--tree-filter'],
      ['--index-filter'],
      ['--parent-filter'],
      ['--msg-filter'],
      ['--commit-filter'],
      ['--tag-name-filter'],
   ])('blocks: %s', async (flag) => {
      const poc = await setUp();

      assertGitError(await promiseError(filterBranch(poc, flag)), 'allowUnsafeExec');
      expect(poc.pwned()).toBe(false);
   });

   it('control: executes when allowUnsafeExec is enabled', async () => {
      const poc = await setUp();

      await promiseError(filterBranch(poc, '--tree-filter', { allowUnsafeExec: true }));
      expect(poc.pwned()).toBe(true);
   });
});
