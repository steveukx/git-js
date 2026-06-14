import { isPathSpec, pathspec } from '@simple-git/args-pathspec';
import { lsFiles } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('lsFiles (arguments)', () => {
   it('wraps each path in a pathspec so a flag-like name is not an option', () => {
      const task = lsFiles(['-weird-name.txt', 'src/index.ts']);
      expect(task.commands.map(String)).toEqual(['ls-files', '-weird-name.txt', 'src/index.ts']);
      expect(isPathSpec(task.commands[1])).toBe(true);
      expect(isPathSpec(task.commands[2])).toBe(true);
   });

   it('places options before the paths', () => {
      const task = lsFiles('a.txt', '--others');
      expect(task.commands.map(String)).toEqual(['ls-files', '--others', 'a.txt']);
   });

   it('emits a bare ls-files when no paths are supplied', () => {
      expect(lsFiles().commands).toEqual(['ls-files']);
      expect(pathspec).toBeTypeOf('function');
   });

   it('parses output into a list of paths', () => {
      expect(lsFiles().parser('a.txt\nb.txt\n', '')).toEqual(['a.txt', 'b.txt']);
   });
});
