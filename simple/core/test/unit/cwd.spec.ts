import type { SimpleGitCore } from '../../index';
import {
   assertNoExecutedTasks,
   isInvalidDirectory,
   isValidDirectory,
   newSimpleGit,
   wait,
} from '../__fixtures__';

describe('cwd', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('to a known directory', async () => {
      isValidDirectory();

      git.cwd('./');

      await wait();
      assertNoExecutedTasks();
   });

   it('to an invalid directory', async () => {
      isInvalidDirectory();

      git.cwd('./invalid_path');

      await wait();
      assertNoExecutedTasks();
   });
});
