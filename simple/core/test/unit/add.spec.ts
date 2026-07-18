import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('add', () => {
   let git: SimpleGitCore;

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
});
