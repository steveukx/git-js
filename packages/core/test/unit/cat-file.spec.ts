import { catFile, catFileBuffer } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('catFile (arguments)', () => {
   it('builds a utf-8 cat-file command', () => {
      const task = catFile(['-p', 'HEAD:file.txt']);
      expect(task.format).toBe('utf-8');
      expect(task.commands).toEqual(['cat-file', '-p', 'HEAD:file.txt']);
   });
});

describe('catFileBuffer (arguments)', () => {
   it('builds a buffer cat-file command', () => {
      const task = catFileBuffer(['blob', 'deadbeef']);
      expect(task.format).toBe('buffer');
      expect(task.commands).toEqual(['cat-file', 'blob', 'deadbeef']);
   });

   it('returns the raw buffer from its parser', () => {
      const bytes = Buffer.from([0, 1, 2, 255]);
      expect(catFileBuffer().parser(bytes, Buffer.alloc(0))).toBe(bytes);
   });
});
