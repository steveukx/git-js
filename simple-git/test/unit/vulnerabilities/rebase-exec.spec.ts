import { promiseError } from '@kwsites/promise-result';
import { describe, expect, it } from 'vitest';

import { assertGitError, closeWithSuccess } from '../__fixtures__';
import { simpleGit } from '../../../src/lib/git-factory';

describe('rebase --exec', () => {
   it('catches bare rebase -x', async () => {
      const task = promiseError(simpleGit().rebase(['-x', 'cmd']));
      await promiseError(closeWithSuccess(''));

      assertGitError(await task, 'allowUnsafeExec');
   });

   it('catches rebase -qx', async () => {
      const task = promiseError(simpleGit().rebase(['-qx', 'cmd']));
      await promiseError(closeWithSuccess(''));

      assertGitError(await task, 'allowUnsafeExec');
   });

   it('catches rebase --exec', async () => {
      const task = promiseError(simpleGit().rebase(['--exec', 'cmd']));
      await promiseError(closeWithSuccess(''));

      assertGitError(await task, 'allowUnsafeExec');
   });

   it('allows: rebase -qm', async () => {
      const task = promiseError(simpleGit().rebase(['-qm', 'foo']));
      await promiseError(closeWithSuccess(''));

      expect(await task).toBeUndefined();
   });
});
