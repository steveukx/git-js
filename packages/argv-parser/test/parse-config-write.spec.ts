import { describe, expect, it } from 'vitest';

import { parseArgv } from '../src/parse-argv';
import { aWriteConfig } from './__fixtures__/mocks';

describe('git config writes', () => {
   it('two positionals → local set', () => {
      expect(parseArgv('config', 'user.name', 'Steve').config.write).toContainEqual(
         aWriteConfig('user.name', 'local', 'Steve')
      );
   });

   it('--global scope', () => {
      expect(
         parseArgv('config', '--global', 'user.email', 'dev@example.com').config.write
      ).toContainEqual(aWriteConfig('user.email', 'global', 'dev@example.com'));
   });

   it('--system scope', () => {
      expect(parseArgv('config', '--system', 'core.editor', 'vim').config.write).toContainEqual(
         aWriteConfig('core.editor', 'system', 'vim')
      );
   });

   it('--worktree scope', () => {
      expect(
         parseArgv('config', '--worktree', 'core.sparseCheckout', 'true').config.write
      ).toContainEqual(aWriteConfig('core.sparsecheckout', 'worktree', 'true'));
   });

   it('--file scope', () => {
      expect(
         parseArgv('config', '--file', '/tmp/c.cfg', 'core.editor', 'vim').config.write
      ).toContainEqual(aWriteConfig('core.editor', 'file', 'vim'));
   });

   it('--unset → write without value', () => {
      expect(parseArgv('config', '--unset', 'user.name').config.write).toContainEqual(
         aWriteConfig('user.name', 'local')
      );
   });

   it('--unset-all → write without value', () => {
      expect(parseArgv('config', '--unset-all', 'core.editor').config.write).toContainEqual(
         aWriteConfig('core.editor', 'local')
      );
   });

   it('--remove-section → key is the section name, no value', () => {
      expect(parseArgv('config', '--remove-section', 'user').config.write).toContainEqual(
         aWriteConfig('user', 'local')
      );
   });

   it('--rename-section → key = old name, value = new name', () => {
      expect(parseArgv('config', '--rename-section', 'user', 'author').config.write).toContainEqual(
         aWriteConfig('user', 'local', 'author')
      );
   });

   it('--add → key + value', () => {
      expect(
         parseArgv('config', '--add', 'remote.origin.fetch', 'refs/*').config.write
      ).toContainEqual(aWriteConfig('remote.origin.fetch', 'local', 'refs/*'));
   });

   it('sub-command syntax: config set key value', () => {
      expect(parseArgv('config', 'set', 'core.editor', 'vim').config.write).toContainEqual(
         aWriteConfig('core.editor', 'local', 'vim')
      );
   });

   it('sub-command syntax with scope: config --global set key value', () => {
      expect(
         parseArgv('config', '--global', 'set', 'user.name', 'Steve').config.write
      ).toContainEqual(aWriteConfig('user.name', 'global', 'Steve'));
   });

   it('lower-cases the key', () => {
      expect(parseArgv('config', 'Core.Editor', 'vim').config.write[0].key).toBe('core.editor');
   });

   it('--list produces no writes', () => {
      expect(parseArgv('config', '--list').config.write).toEqual([]);
   });

   it('--edit produces no writes (unknowable at parse time)', () => {
      expect(parseArgv('config', '--edit').config.write).toEqual([]);
   });
});
