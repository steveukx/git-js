import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimpleGit } from '../..';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('add', () => {
   let git: SimpleGit;

   beforeEach(() => (git = newSimpleGit()));

   it('adds a single file', async () => {
      const queue = git.add('file.ext');
      await closeWithSuccess('raw response');

      expect(await queue).toBe('raw response');
      assertExecutedCommands('add', 'file.ext');
   });

   it('adds multiple files', async () => {
      const queue = git.add(['file.one', 'file.two']);
      await closeWithSuccess('raw response');

      expect(await queue).toBe('raw response');
      assertExecutedCommands('add', 'file.one', 'file.two');
   });

   it('adds files with trailing callback', async () => {
      const callback = vi.fn();
      const queue = git.add(['file.one', 'file.two'], callback);
      await closeWithSuccess('raw response');

      expect(await queue).toBe('raw response');
      expect(callback).toHaveBeenCalledWith(null, 'raw response');
   });
});
