import { init, parseInit } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('init', () => {
   it('builds a plain init descriptor', () => {
      expect(init().commands).toEqual(['init']);
   });

   it('inserts --bare after the verb when requested', () => {
      expect(init(true, '/tmp/repo').commands).toEqual(['init', '--bare']);
   });

   it('does not duplicate a caller-supplied --bare', () => {
      expect(init(true, '/tmp/repo', ['--bare']).commands).toEqual(['init', '--bare']);
   });

   it('passes custom args through', () => {
      expect(init(false, '/tmp/repo', ['--quiet']).commands).toEqual(['init', '--quiet']);
   });

   it('accepts an options object alongside --bare', () => {
      expect(init(true, '/tmp/repo', { '--quiet': null }).commands).toEqual([
         'init',
         '--bare',
         '--quiet',
      ]);
   });

   it('parses a fresh initialisation', () => {
      const result = parseInit(
         false,
         '/tmp/repo',
         'Initialized empty Git repository in /tmp/repo/.git/'
      );
      expect(result).toEqual({
         bare: false,
         path: '/tmp/repo',
         existing: false,
         gitDir: '/tmp/repo/.git/',
      });
   });

   it('parses a re-initialisation as existing', () => {
      const result = parseInit(
         true,
         '/tmp/repo',
         'Reinitialized existing Git repository in /tmp/repo/'
      );
      expect(result).toMatchObject({ existing: true, bare: true, gitDir: '/tmp/repo/' });
   });

   it('falls back to the gitDir following "in"', () => {
      const result = parseInit(false, '/tmp/repo', 'Created repository in /custom/path');
      expect(result.gitDir).toBe('/custom/path');
   });
});
