import { promiseError } from '@kwsites/promise-result';

import type { SimpleGitCore } from '../../index';
import {
   assertGitError,
   closeWithError,
   closeWithSuccess,
   mockChildProcessModule,
   newSimpleGit,
} from '../__fixtures__';

describe('child-process', () => {
   let git: SimpleGitCore;

   function spawnedEnv() {
      return mockChildProcessModule.$mostRecent().$env;
   }

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('handles child process errors', async () => {
      const queue = git.init();
      await closeWithError('SOME ERROR');

      const error = await promiseError(queue);
      assertGitError(error, 'SOME ERROR');
   });

   // @simple-git/core inherits the ambient environment by default (§2.7) rather
   // than v3's "undefined env means inherit everything" - so the child always
   // receives a populated env object built from process.env.
   it('inherits the ambient environment by default', async () => {
      git.init();
      await closeWithSuccess();
      expect(spawnedEnv()).toEqual(expect.objectContaining({ PATH: process.env.PATH }));
   });

   it('supports passing individual environment variables alongside the ambient environment', async () => {
      git.env('foo', 'bar').env('baz', 'bat').init();
      await closeWithSuccess();
      expect(spawnedEnv()).toEqual(expect.objectContaining({ foo: 'bar', baz: 'bat' }));
   });

   it('supports passing an environment object alongside the ambient environment', async () => {
      git.env({ foo: 'bar' }).init();
      await closeWithSuccess();
      expect(spawnedEnv()).toEqual(expect.objectContaining({ foo: 'bar' }));
   });
});
