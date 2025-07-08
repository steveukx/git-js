import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimpleGit } from '../..';
import {
   assertNoExecutedTasks,
   isInvalidDirectory,
   isValidDirectory,
   newSimpleGit,
   wait,
} from './__fixtures__';

describe('cwd', () => {
   let git: SimpleGit;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('to a known directory', async () => {
      await isValidDirectory();

      const callback = vi.fn();
      git.cwd('./', callback);

      await wait();
      expect(callback).toHaveBeenCalledWith(null, './');
      assertNoExecutedTasks();
   });

   it('to an invalid directory', async () => {
      await isInvalidDirectory();

      const callback = vi.fn((err) => expect(err.message).toMatch('invalid_path'));
      git.cwd('./invalid_path', callback);

      await wait();
      expect(callback).toHaveBeenCalledWith(expect.any(Error), undefined);
      assertNoExecutedTasks();
   });
});
