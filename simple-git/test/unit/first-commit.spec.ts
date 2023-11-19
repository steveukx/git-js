import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('firstCommit', () => {
   it('gets the first commit in a repo', async () => {
      const task = newSimpleGit().firstCommit();
      await closeWithSuccess('a-commit-hash\n');

      expect(await task).toBe('a-commit-hash');
      assertExecutedCommands('rev-list', '--max-parents=0', 'HEAD');
   });
});
