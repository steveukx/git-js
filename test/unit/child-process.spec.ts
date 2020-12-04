import { promiseError } from '@kwsites/promise-result';
import { assertChildProcessEnvironmentVariables, assertGitError, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';

const {closeWithSuccess, closeWithError, restore} = require('./include/setup');

describe('child-process', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });
   afterEach(() => restore());

   it('handles child process errors', async () => {
      const queue = git.init(callback);
      await closeWithError('SOME ERROR');

      const error = await promiseError(queue);
      expect(callback).toHaveBeenCalledWith(error);
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
      assertChildProcessEnvironmentVariables({foo: 'bar', baz: 'bat'});
   });

   it('supports passing environment variables to the underlying child process', async () => {
      git.env({foo: 'bar'}).init();
      await closeWithSuccess();
      assertChildProcessEnvironmentVariables({foo: 'bar'});
   });

});
