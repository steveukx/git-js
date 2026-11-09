import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { createAdvisoryContext } from './advisory-context';

/**
 * Category: renaming a config section moves keys that were written under a harmless looking name
 * into a section where they run commands, eg: `foo.fsmonitor` renamed to `core.fsmonitor`.
 */
describe('advisories: config section rename', () => {
   async function setUp() {
      const poc = await createAdvisoryContext();
      await poc.git().init();
      await poc.git().addConfig('foo.fsmonitor', `${poc.touch}; false`);
      return poc;
   }

   it.each([
      ['--rename-section', ['config', '--rename-section', 'foo', 'core']],
      ['rename-section', ['config', 'rename-section', 'foo', 'core']],
   ])('blocks: %s', async (_name, args) => {
      const poc = await setUp();

      assertGitError(await promiseError(poc.git().raw(...args)), 'allowUnsafeConfigRename');
      await poc.git().status();

      expect(poc.pwned()).toBe(false);
   });

   it('blocks: naming the section in allowConfig does not permit the rename', async () => {
      const poc = await setUp();

      const err = await promiseError(
         poc.git({ allowConfig: ['foo', 'foo.*'] }).raw('config', '--rename-section', 'foo', 'core')
      );

      assertGitError(err, 'allowUnsafeConfigRename');
   });

   it('control: executes when allowUnsafeConfigRename is enabled', async () => {
      const poc = await setUp();

      await poc
         .git({ unsafe: { allowUnsafeConfigRename: true } })
         .raw('config', '--rename-section', 'foo', 'core');
      await promiseError(poc.git().status());

      expect(poc.pwned()).toBe(true);
   });
});
