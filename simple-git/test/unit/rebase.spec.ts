import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import type { SimpleGit } from '../..';

describe('rebase', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = vi.fn();
   });

   it('rebases', async () => {
      const queue = git.rebase(callback);
      await closeWithSuccess('some data');

      expect(await queue).toBe('some data');
      expect(callback).toHaveBeenCalledWith(null, 'some data');
      assertExecutedCommands('rebase');
   });

   it('rebases with array of options', async () => {
      git.rebase(['master', 'topic']);
      await closeWithSuccess('some data');
      assertExecutedCommands('rebase', 'master', 'topic');
   });

   it('rebases with object of options', async () => {
      git.rebase({ '--foo': null });
      await closeWithSuccess('some data');
      assertExecutedCommands('rebase', '--foo');
   });
});
