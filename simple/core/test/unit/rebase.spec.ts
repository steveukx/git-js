import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('rebase', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('rebases', async () => {
      const queue = git.rebase();
      await closeWithSuccess('some data');

      expect(await queue).toBe('some data');
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
