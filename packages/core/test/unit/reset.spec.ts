import { getResetMode, ResetMode, reset } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('reset', () => {
   it('defaults to a soft reset when no mode is given', () => {
      expect(reset().commands).toEqual(['reset', '--soft']);
   });

   it('applies a recognised mode', () => {
      expect(reset(ResetMode.HARD).commands).toEqual(['reset', '--hard']);
   });

   it('treats a leading array as options, not a mode', () => {
      expect(reset(['path/to/file']).commands).toEqual(['reset', 'path/to/file']);
   });

   it('treats a leading options object as options, not a mode', () => {
      expect(reset({ '--quiet': null }).commands).toEqual(['reset', '--quiet']);
   });

   it('combines a mode with trailing options', () => {
      expect(reset(ResetMode.MIXED, { '--quiet': null }).commands).toEqual([
         'reset',
         '--mixed',
         '--quiet',
      ]);
   });
});

describe('getResetMode', () => {
   it('passes a valid mode through', () => {
      expect(getResetMode(ResetMode.KEEP)).toBe(ResetMode.KEEP);
   });

   it('defaults an unknown string or undefined to soft', () => {
      expect(getResetMode('not-a-mode')).toBe(ResetMode.SOFT);
      expect(getResetMode(undefined)).toBe(ResetMode.SOFT);
   });

   it('returns undefined when the argument is options rather than a mode', () => {
      expect(getResetMode(['--quiet'])).toBeUndefined();
      expect(getResetMode({ '--quiet': null })).toBeUndefined();
   });
});
