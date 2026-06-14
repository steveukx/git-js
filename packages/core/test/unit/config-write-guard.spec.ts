import { blessConfig, configWriteGuardPlugin, GitPluginError } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

const context = { method: '', commands: [] };

function guard(allow: readonly string[]) {
   return configWriteGuardPlugin(allow);
}

describe('configWriteGuardPlugin', () => {
   it('permits an allow-listed inline -c write', () => {
      const args = ['-c', 'user.name=Steve', 'status'];
      expect(guard(['user.name']).action(args, context)).toBe(args);
   });

   it('blocks an un-allow-listed inline -c write', () => {
      expect(() => guard(['user.name']).action(['-c', 'core.pager=cat', 'log'], context)).toThrow(
         GitPluginError
      );
   });

   it('blocks a config sub-command write', () => {
      expect(() => guard([]).action(['config', 'user.email', 's@e.com'], context)).toThrow(
         GitPluginError
      );
   });

   it('supports a single-segment wildcard', () => {
      const plugin = guard(['remote.*.url']);
      expect(plugin.action(['config', 'remote.origin.url', 'x'], context)).toBeTruthy();
      expect(() => plugin.action(['config', 'remote.origin.fetch', 'x'], context)).toThrow(
         GitPluginError
      );
   });

   it('exempts a blessed write even when the allow-list is empty', () => {
      const args = ['-c', blessConfig('core.abbrev', '40'), 'commit', '-m', 'x'];
      expect(guard([]).action(args, context)).toBe(args);
   });

   it('still blocks a non-blessed write alongside a blessed one', () => {
      const args = ['-c', blessConfig('core.abbrev', '40'), '-c', 'core.pager=cat', 'log'];
      expect(() => guard([]).action(args, context)).toThrow(GitPluginError);
   });

   it('names the offending key and the option in the error', () => {
      expect(() => guard([]).action(['-c', 'core.pager=cat', 'log'], context)).toThrow(
         /core\.pager.*allowConfigWrite/s
      );
   });
});
