import {
   allowConfigWriteUser,
   blessConfig,
   blessedConfigIntent,
   isBlessedConfig,
   isConfigWriteAllowed,
} from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('blessConfig', () => {
   it('brands a value that isBlessedConfig recognises', () => {
      const value = blessConfig('core.abbrev', '40');
      expect(String(value)).toBe('core.abbrev=40');
      expect(isBlessedConfig(value)).toBe(true);
   });

   it('does not recognise a plain string', () => {
      expect(isBlessedConfig('core.abbrev=40')).toBe(false);
   });

   it('exposes the parsed intent', () => {
      expect(blessedConfigIntent(blessConfig('user.name', 'Steve'))).toEqual({
         key: 'user.name',
         value: 'Steve',
      });
   });
});

describe('isConfigWriteAllowed', () => {
   it('matches exact keys case-insensitively', () => {
      expect(isConfigWriteAllowed('User.Name', ['user.name'])).toBe(true);
      expect(isConfigWriteAllowed('user.email', ['user.name'])).toBe(false);
   });

   it('matches a single-segment wildcard but not across segment counts', () => {
      expect(isConfigWriteAllowed('remote.origin.url', ['remote.*.url'])).toBe(true);
      expect(isConfigWriteAllowed('remote.url', ['remote.*.url'])).toBe(false);
   });
});

describe('allowConfigWriteUser', () => {
   it('is the spreadable identity preset', () => {
      expect(allowConfigWriteUser).toEqual(['user.name', 'user.email']);
   });
});
