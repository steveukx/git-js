import {
   bufferTask,
   configurationErrorTask,
   emptyTask,
   isBufferTask,
   isEmptyTask,
   stringTask,
} from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('task primitives', () => {
   it('stringTask returns utf-8 output verbatim', () => {
      const task = stringTask(['status']);
      expect(task).toMatchObject({ format: 'utf-8', commands: ['status'] });
      expect(task.parser('  hello  ', '')).toBe('  hello  ');
   });

   it('stringTask trims when asked', () => {
      expect(stringTask(['status'], true).parser('  hello  ', '')).toBe('hello');
   });

   it('bufferTask returns the buffer untouched', () => {
      const buffer = Buffer.from('binary');
      const task = bufferTask(['cat-file']);
      expect(task.format).toBe('buffer');
      expect(task.parser(buffer, Buffer.alloc(0))).toBe(buffer);
   });

   it('emptyTask runs no command', () => {
      const task = emptyTask(() => 42);
      expect(task.format).toBe('empty');
      expect(task.commands).toEqual([]);
      expect(task.parser()).toBe(42);
   });

   it('configurationErrorTask throws the supplied error when parsed', () => {
      const error = new Error('bad arguments');
      expect(() => configurationErrorTask(error).parser()).toThrow(error);
   });

   it('isBufferTask discriminates on format', () => {
      expect(isBufferTask(bufferTask(['x']))).toBe(true);
      expect(isBufferTask(stringTask(['x']))).toBe(false);
   });

   it('isEmptyTask is true for empty format and for commandless tasks', () => {
      expect(isEmptyTask(emptyTask(() => null))).toBe(true);
      expect(isEmptyTask(stringTask([]))).toBe(true);
      expect(isEmptyTask(stringTask(['status']))).toBe(false);
   });
});
