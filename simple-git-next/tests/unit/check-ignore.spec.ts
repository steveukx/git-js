import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';

describe('checkIgnore', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('with single excluded file specified', async () => {
      const queue = git.checkIgnore('foo.log', callback);
      closeWithSuccess('foo.log');

      expect(callback).toHaveBeenCalledWith(null, await queue);
      assertExecutedCommands('check-ignore', 'foo.log');
   });

   it('with two excluded files specified', async () => {
      const queue = git.checkIgnore(['foo.log', 'bar.log']);
      closeWithSuccess(`
         foo.log
         bar.log
      `);

      expect(await queue).toEqual(['foo.log', 'bar.log']);
      assertExecutedCommands('check-ignore', 'foo.log', 'bar.log');
   });

   it('with no excluded files', async () => {
      const queue = git.checkIgnore(['foo.log', 'bar.log']);
      closeWithSuccess();

      expect(await queue).toEqual([]);
      assertExecutedCommands('check-ignore', 'foo.log', 'bar.log');
   });

   it('with spaces in file names', async () => {
      const queue = git.checkIgnore('foo space .log');
      closeWithSuccess(' foo space .log ');

      expect(await queue).toEqual(['foo space .log']);
      assertExecutedCommands('check-ignore', 'foo space .log');
   });
});
