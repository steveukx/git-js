import { promiseError } from '@kwsites/promise-result';
import { beforeEach, describe, it, type Mock, vi } from 'vitest';

import { TaskConfigurationError } from '../..';
import type { SimpleGit } from '../../src/typings';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';

describe('revert', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = vi.fn();
   });

   it('reverts', async () => {
      git.revert('HEAD~3', callback);
      await closeWithSuccess();
      assertExecutedCommands('revert', 'HEAD~3');
   });

   it('reverts a range', async () => {
      git.revert('master~5..master~2', { '-n': null }, callback);
      await closeWithSuccess();
      assertExecutedCommands('revert', '-n', 'master~5..master~2');
   });

   it('requires a string', async () => {
      const err = await promiseError(git.revert(callback as any));
      assertGitError(err, 'Commit must be a string', TaskConfigurationError);
      assertNoExecutedTasks();
   });
});
