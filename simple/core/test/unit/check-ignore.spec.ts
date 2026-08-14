import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('checkIgnore', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('with single excluded file specified', async () => {
      git.checkIgnore('foo.log');
      await closeWithSuccess('foo.log');

      assertExecutedCommands('check-ignore', 'foo.log');
   });

   it('with two excluded files specified', async () => {
      const queue = git.checkIgnore(['foo.log', 'bar.log']);
      await closeWithSuccess(`
         foo.log
         bar.log
      `);

      expect(await queue).toEqual(['foo.log', 'bar.log']);
      assertExecutedCommands('check-ignore', 'foo.log', 'bar.log');
   });

   it('with no excluded files', async () => {
      const queue = git.checkIgnore(['foo.log', 'bar.log']);
      await closeWithSuccess();

      expect(await queue).toEqual([]);
      assertExecutedCommands('check-ignore', 'foo.log', 'bar.log');
   });

   it('with spaces in file names', async () => {
      const queue = git.checkIgnore('foo space .log');
      await closeWithSuccess(' foo space .log ');

      expect(await queue).toEqual(['foo space .log']);
      assertExecutedCommands('check-ignore', 'foo space .log');
   });
});
