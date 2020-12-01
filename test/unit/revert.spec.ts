import { assertExecutedCommands, assertExecutedTasksCount, assertGitError, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';
import { promiseError } from '@kwsites/promise-result';
import { TaskConfigurationError } from '../../src/lib/errors/task-configuration-error';

const {restore, closeWithSuccess} = require('./include/setup');

describe('revert', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });
   afterEach(() => restore());

   it('reverts', async () => {
      git.revert('HEAD~3', callback);
      await closeWithSuccess();
      assertExecutedCommands('revert', 'HEAD~3');
   });

   it('reverts a range', async () => {
      git.revert('master~5..master~2', {'-n': null}, callback);
      await closeWithSuccess();
      assertExecutedCommands('revert', '-n', 'master~5..master~2');
   });

   it('requires a string', async () => {
      const err = await promiseError(git.revert(callback as any));
      assertGitError(err, 'Commit must be a string', TaskConfigurationError);
      assertExecutedTasksCount(0);
   });

});
