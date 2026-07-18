import { promiseError } from '@kwsites/promise-result';

import { TaskConfigurationError } from '../..';
import type { SimpleGitCore } from '../../index';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('revert', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('reverts', async () => {
      git.revert('HEAD~3');
      await closeWithSuccess();
      assertExecutedCommands('revert', 'HEAD~3');
   });

   it('reverts a range', async () => {
      git.revert('master~5..master~2', { '-n': null });
      await closeWithSuccess();
      assertExecutedCommands('revert', '-n', 'master~5..master~2');
   });

   it('requires a string', async () => {
      const err = await promiseError(git.revert(undefined as any));
      assertGitError(err, 'Commit must be a string', TaskConfigurationError);
      assertNoExecutedTasks();
   });
});
