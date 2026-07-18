/**
 * Prototype for the vitest port of v3's `jest.mock('child_process')` singleton
 * pattern (adapted from v3's `add.spec.ts` - the `add()` task factory arrives
 * with the task-porting phase, so the commands here run through `git.raw`).
 */
import { promiseError } from '@kwsites/promise-result';

import { GitError } from '../../src/errors';
import {
   assertAllExecutedCommands,
   assertChildProcessSpawnOptions,
   assertExecutedCommands,
   closeWithError,
   closeWithSuccess,
   mockChildProcessModule,
   newSimpleGit,
   theChildProcess,
   wait,
} from '../__fixtures__';

describe('child process mock rig', () => {
   it('captures spawned commands and resolves with stdout', async () => {
      const queue = newSimpleGit().raw('add', 'file.ext');
      await closeWithSuccess('raw response');

      expect(await queue).toBe('raw response');
      assertExecutedCommands('add', 'file.ext');
   });

   it('resets the singleton between tests', () => {
      expect(mockChildProcessModule.$count()).toBe(0);
   });

   it('rejects with a GitError carrying stdErr detail on failure', async () => {
      const queue = newSimpleGit().raw('add', 'file.ext');
      await wait();

      theChildProcess().stderr.$emit('data', Buffer.from('fatal: pathspec did not match'));
      await closeWithError('fatal: pathspec did not match');

      const error = await promiseError(queue);
      expect(error).toBeInstanceOf(GitError);
      expect(String(error?.message)).toContain('fatal: pathspec did not match');
   });

   it('spawns with the ambient environment merged with .env() values', async () => {
      const queue = newSimpleGit().env('SIMPLE_GIT_TEST_VAR', 'value').raw('status');
      await closeWithSuccess();
      await queue;

      const env = mockChildProcessModule.$mostRecent().$env;
      expect(env.SIMPLE_GIT_TEST_VAR).toBe('value');
      expect(env.PATH).toBe(process.env.PATH);
      assertChildProcessSpawnOptions({ cwd: process.cwd(), windowsHide: true });
   });

   it('runs queued tasks in series on one chain', async () => {
      const git = newSimpleGit();
      const queue = Promise.all([git.raw('init'), git.raw('status')]);

      await closeWithSuccess('first');
      await closeWithSuccess('second');

      expect(await queue).toEqual(['first', 'second']);
      assertAllExecutedCommands(['init'], ['status']);
   });
});
