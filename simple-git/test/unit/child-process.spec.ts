import { promiseError } from '@kwsites/promise-result';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { SimpleGit } from '../../src/typings';
import {
   assertChildProcessEnvironmentVariables,
   assertGitError,
   closeWithError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';

const ENV = {
   GIT_TEST_DISALLOW_ABBREVIATED_OPTIONS: 'true',
};

describe('child-process', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = vi.fn();
   });

   it('handles child process errors', async () => {
      const queue = git.init(callback);
      await closeWithError('SOME ERROR');

      const error = await promiseError(queue);
      expect(callback).toHaveBeenCalledWith(error, undefined);
      assertGitError(error, 'SOME ERROR');
   });

   describe('default environment variables', () => {
      const env = process.env;
      const envOverride = {
         GIT_AUTHOR_NAME: 'Steve',
         FOO: 'bar',
      };

      beforeEach(() => {
         Object.defineProperty(process, 'env', {
            configurable: true,
            value: envOverride,
         });
      });

      afterEach(() => {
         process.env = env;
      });

      it('passes process default environment variables by default', async () => {
         git.init(callback);
         await closeWithSuccess();
         assertChildProcessEnvironmentVariables({ FOO: 'bar', ...ENV });
      });
   });

   it('supports passing individual environment variables to the underlying child process', async () => {
      git.env('foo', 'bar').env('baz', 'bat').init();
      await closeWithSuccess();
      assertChildProcessEnvironmentVariables({ foo: 'bar', baz: 'bat', ...ENV });
   });

   it('supports passing environment variables to the underlying child process', async () => {
      git.env({ foo: 'bar' }).init();
      await closeWithSuccess();
      assertChildProcessEnvironmentVariables({ foo: 'bar', ...ENV });
   });
});
