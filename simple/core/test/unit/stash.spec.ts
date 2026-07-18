import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('stash', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('supports selecting all files with a star', async () => {
      git.stash(['push', '--', '*']);
      await closeWithSuccess();

      assertExecutedCommands('stash', 'push', '--', '*');
   });

   it('stash working directory', async () => {
      git.stash();
      await closeWithSuccess();

      assertExecutedCommands('stash');
   });

   it('stash pop', async () => {
      git.stash(['pop']);
      await closeWithSuccess();

      assertExecutedCommands('stash', 'pop');
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
