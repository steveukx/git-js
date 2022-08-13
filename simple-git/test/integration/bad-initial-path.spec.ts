import {
   assertGitError,
   createTestContext,
   like,
   newSimpleGit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { GitConstructError } from '../..';

describe('bad initial path', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('simple-git', async () => {
      const baseDir = context.path('foo');

      let errorInstance: Error | unknown;
      try {
         newSimpleGit(baseDir);
      } catch (e) {
         errorInstance = e;
         assertGitError(errorInstance, `does not exist`, GitConstructError);
         expect(errorInstance).toHaveProperty(
            'config',
            like({
               baseDir,
            })
         );
      } finally {
         expect(errorInstance).not.toBeUndefined();
      }
   });
});
