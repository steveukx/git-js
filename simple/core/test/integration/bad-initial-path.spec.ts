import { GitConstructError } from '../../index';
import {
   assertGitError,
   createTestContext,
   like,
   newSimpleGit,
   type SimpleGitTestContext,
} from '../__fixtures__/integration';

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
