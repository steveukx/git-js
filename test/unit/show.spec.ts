import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';
import { showAbbrevCommitSingleFile } from './__fixtures__/responses/show';

describe('show', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('passes the response through without editing', async () => {
      const {stdOut} = showAbbrevCommitSingleFile();

      const queue = git.show(callback);
      await closeWithSuccess(stdOut);
      expect(await queue).toBe(stdOut);
   });

   it('allows the use of an array of options', async () => {
      git.show(['--abbrev-commit', 'foo', 'bar'], callback);
      await closeWithSuccess();
      assertExecutedCommands('show', '--abbrev-commit', 'foo', 'bar');
   });

   it('allows an options string', async () => {
      git.show('--abbrev-commit', callback);
      await closeWithSuccess();
      assertExecutedCommands('show', '--abbrev-commit');
   });

   it('allows an options object', async () => {
      git.show({'--foo': null}, callback);
      await closeWithSuccess();
      assertExecutedCommands('show', '--foo');
   });

});
