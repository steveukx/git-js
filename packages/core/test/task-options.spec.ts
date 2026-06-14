import { pathspec } from '@simple-git/args-pathspec';
import { appendOptions, asTaskOptions } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('appendOptions', () => {
   it('renders null values as bare flags', () => {
      expect(appendOptions({ '--quiet': null })).toEqual(['--quiet']);
   });

   it('renders string/number values as key=value', () => {
      expect(appendOptions({ '--depth': 1, '--branch': 'main' })).toEqual([
         '--depth=1',
         '--branch=main',
      ]);
   });

   it('renders array values as repeated key=value', () => {
      expect(appendOptions({ '-c': ['a=1', 'b=2'] })).toEqual(['-c=a=1', '-c=b=2']);
   });

   it('renders a pathspec value as a bare argument', () => {
      expect(appendOptions({ path: pathspec('src/**') })).toEqual(['src/**']);
   });

   it('ignores a non-object', () => {
      expect(appendOptions(undefined)).toEqual([]);
   });
});

describe('asTaskOptions', () => {
   it('accepts varargs strings', () => {
      expect(asTaskOptions(['--force', '--verbose'])).toEqual(['--force', '--verbose']);
   });

   it('accepts a single string[] passthrough', () => {
      expect(asTaskOptions([['--force', '--verbose']])).toEqual(['--force', '--verbose']);
   });

   it('accepts a single options object', () => {
      expect(asTaskOptions([{ '--depth': 1 }])).toEqual(['--depth=1']);
   });

   it('preserves order across a mix of forms', () => {
      expect(asTaskOptions(['--a', ['--b'], { '--c': null }])).toEqual(['--a', '--b', '--c']);
   });

   it('returns an empty array for no options', () => {
      expect(asTaskOptions()).toEqual([]);
   });
});
