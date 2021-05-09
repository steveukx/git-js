import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   like,
   newSimpleGit,
   newSimpleGitP,
   SimpleGitTestContext
} from '../__fixtures__';

import { GitConstructError } from '../..';

describe('bad initial path', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());

   it('simple-git/promise', async () => {
      const baseDir = context.path('foo');
      const git = newSimpleGitP(baseDir);

      const errorInstance = await promiseError(git.init());
      assertGitError(errorInstance, `does not exist`, GitConstructError);
      expect(errorInstance).toHaveProperty('config', like({
         baseDir,
      }));
   });

   it('simple-git', async () => {
      const baseDir = context.path('foo');

      let errorInstance: Error | undefined;
      try {
         newSimpleGit(baseDir);
      } catch (e) {
         errorInstance = e;
         assertGitError(errorInstance, `does not exist`, GitConstructError);
         expect(errorInstance).toHaveProperty('config', like({
            baseDir,
         }));
      } finally {
         expect(errorInstance).not.toBeUndefined();
      }
   });

});
