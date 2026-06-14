import { add } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('add', () => {
   it('stages a single pathspec', () => {
      expect(add('.').commands).toEqual(['add', '.']);
   });

   it('stages multiple paths', () => {
      expect(add(['src', 'test']).commands).toEqual(['add', 'src', 'test']);
   });

   it('appends custom args after the paths', () => {
      expect(add('.', ['--force']).commands).toEqual(['add', '.', '--force']);
   });

   it('accepts varargs and an options object after the paths', () => {
      expect(add('.', '--verbose', { '--chmod': '+x' }).commands).toEqual([
         'add',
         '.',
         '--verbose',
         '--chmod=+x',
      ]);
   });

   it('returns a utf-8 task that echoes git output', () => {
      const task = add('.');
      expect(task.format).toBe('utf-8');
      expect(task.parser('', '')).toBe('');
   });
});
