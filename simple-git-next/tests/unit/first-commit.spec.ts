import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('firstCommit', () => {
   it('gets the first commit in a repo async', async () => {
      const task = newSimpleGit().firstCommit();
      await closeWithSuccess('a-commit-hash\n');

      expect(await task).toBe('a-commit-hash');
      assertExecutedCommands('rev-list', '--max-parents=0', 'HEAD');
   });

   it('gets the first commit in a repo callback', async () => {
      const callback = jest.fn();
      const task = newSimpleGit().firstCommit(callback);
      await closeWithSuccess('a-commit-hash\n');

      expect(callback).toHaveBeenCalledWith(null, await task);
      assertExecutedCommands('rev-list', '--max-parents=0', 'HEAD');
   });
});
