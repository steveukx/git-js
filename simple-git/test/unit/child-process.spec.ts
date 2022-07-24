import { promiseError } from '@kwsites/promise-result';
import {
   assertChildProcessEnvironmentVariables,
   assertGitError,
   closeWithError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';
import { SimpleGit } from '../../typings';

describe('child-process', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('handles child process errors', async () => {
      const queue = git.init(callback);
      await closeWithError('SOME ERROR');

      const error = await promiseError(queue);
      expect(callback).toHaveBeenCalledWith(error, undefined);
      assertGitError(error, 'SOME ERROR');
   });

   it('passes empty set of environment variables by default', async () => {
      git.init(callback);
      await closeWithSuccess();
      assertChildProcessEnvironmentVariables(undefined);
   });

   it('supports passing individual environment variables to the underlying child process', async () => {
      git.env('foo', 'bar').env('baz', 'bat').init();
      await closeWithSuccess();
      assertChildProcessEnvironmentVariables({ foo: 'bar', baz: 'bat' });
   });

   it('supports passing environment variables to the underlying child process', async () => {
      git.env({ foo: 'bar' }).init();
      await closeWithSuccess();
      assertChildProcessEnvironmentVariables({ foo: 'bar' });
   });
});
