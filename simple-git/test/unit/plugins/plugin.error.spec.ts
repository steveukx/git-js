import { promiseError } from '@kwsites/promise-result';
import { assertGitError, closeWithError, closeWithSuccess, newSimpleGit } from '../__fixtures__';

import { GitError } from '../../..';

describe('errorDetectionPlugin', () => {
   it('can throw with custom content', async () => {
      const errors = jest.fn().mockReturnValue(Buffer.from('foo'));
      const git = newSimpleGit({ errors }).init();
      await closeWithError('err');

      assertGitError(await promiseError(git), 'foo');
   });

   it('can throw error when otherwise deemed ok', async () => {
      const errors = jest.fn().mockReturnValue(new Error('FAIL'));
      const git = newSimpleGit({ errors }).init();
      await closeWithSuccess('OK');

      expect(errors).toHaveBeenCalledWith(undefined, {
         exitCode: 0,
         stdErr: [],
         stdOut: [expect.any(Buffer)],
      });
      assertGitError(await promiseError(git), 'FAIL');
   });

   it('can ignore errors that would otherwise throw', async () => {
      const errors = jest.fn();

      const git = newSimpleGit({ errors }).raw('foo');
      await closeWithError('OUT', 100);

      expect(errors).toHaveBeenCalledWith(expect.any(GitError), {
         exitCode: 100,
         stdOut: [],
         stdErr: [expect.any(Buffer)],
      });
      expect(await promiseError(git)).toBeUndefined();
   });
});
