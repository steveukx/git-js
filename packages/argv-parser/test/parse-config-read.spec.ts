import { parseArgv } from '@simple-git/argv-parser';
import { describe, expect, it } from 'vitest';

import { aReadConfig } from './__fixtures__/mocks';

describe('git config reads', () => {
   it('single positional → local get', () => {
      expect(parseArgv('config', 'user.name').config.read).toEqual([
         aReadConfig('user.name', 'local'),
      ]);
   });

   it('--global scope', () => {
      expect(parseArgv('config', '--global', 'user.email').config.read).toEqual([
         aReadConfig('user.email', 'global'),
      ]);
   });

   it('--get flag', () => {
      expect(parseArgv('config', '--get', 'core.editor').config.read).toContainEqual(
         aReadConfig('core.editor', 'local')
      );
   });

   it('--get-all flag', () => {
      expect(parseArgv('config', '--get-all', 'remote.origin.fetch').config.read).toContainEqual(
         aReadConfig('remote.origin.fetch', 'local')
      );
   });

   it('--get-regexp flag', () => {
      expect(parseArgv('config', '--get-regexp', 'remote').config.read).toContainEqual(
         aReadConfig('remote', 'local')
      );
   });

   it('sub-command syntax: config get key', () => {
      expect(parseArgv('config', 'get', 'user.name').config.read).toContainEqual(
         aReadConfig('user.name', 'local')
      );
   });

   it('sub-command syntax with scope: config --global get key', () => {
      expect(parseArgv('config', '--global', 'get', 'user.email').config.read).toContainEqual(
         aReadConfig('user.email', 'global')
      );
   });

   it('lower-cases the key', () => {
      expect(parseArgv('config', 'User.Name').config.read[0].key).toBe('user.name');
   });

   it('two positionals → write, not read', () => {
      expect(parseArgv('config', 'user.name', 'Steve').config.read).toEqual([]);
   });

   it('--list → no reads (no specific key)', () => {
      expect(parseArgv('config', '--list').config.read).toEqual([]);
   });
});
