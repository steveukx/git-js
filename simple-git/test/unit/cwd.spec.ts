import {describe, expect, it, vi} from 'vitest';

import {assertNoExecutedTasks, isInvalidDirectory, isValidDirectory, newSimpleGit, wait,} from './__fixtures__';

describe('cwd', () => {

   it('to a known directory', async () => {
      await isValidDirectory();

      const callback = vi.fn();
      newSimpleGit().cwd('./', callback);

      await wait();
      expect(callback).toHaveBeenCalledWith(null, './');
      assertNoExecutedTasks();
   });

   it('to an invalid directory', async () => {
      const git = newSimpleGit();
      await isInvalidDirectory();

      const callback = vi.fn((err) => expect(err.message).toMatch('invalid_path'));
      git.cwd('./invalid_path', callback);

      await wait();
      expect(callback).toHaveBeenCalledWith(expect.any(Error), undefined);
      assertNoExecutedTasks();
   });

   it('throws when created with a non-existent directory', async () => {
      await isInvalidDirectory();
      expect(() => newSimpleGit('/tmp/foo-bar-baz')).toThrow();
   });

   it('works with valid directories', async () => {
      await isValidDirectory();
      expect(() => newSimpleGit(__dirname)).not.toThrow();
   });
});
