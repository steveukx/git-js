import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import type { SimpleGit } from '../..';

describe('stash', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = vi.fn();
   });

   it('supports selecting all files with a star', async () => {
      git.stash(['push', '--', '*']);
      await closeWithSuccess();

      assertExecutedCommands('stash', 'push', '--', '*');
   });

   it('stash working directory', async () => {
      const queue = git.stash(callback);
      await closeWithSuccess();

      assertExecutedCommands('stash');
      expect(callback).toHaveBeenCalledWith(null, await queue);
   });

   it('stash pop', async () => {
      const queue = git.stash(['pop'], callback);
      await closeWithSuccess();

      assertExecutedCommands('stash', 'pop');
      expect(callback).toHaveBeenCalledWith(null, await queue);
   });

   it('stash with options no handler', async () => {
      git.stash(['branch', 'some-branch']);
      await closeWithSuccess();

      assertExecutedCommands('stash', 'branch', 'some-branch');
   });

   it('stash with options object no handler', async () => {
      git.stash({ '--foo': null });
      await closeWithSuccess();

      assertExecutedCommands('stash', '--foo');
   });
});
