import { createTestContext as baseCreateTestContext, TestContext } from '@simple-git/test-utils';
import { newSimpleGit } from './instance';
import { SimpleGit } from '../../typings';

export interface SimpleGitTestContext extends TestContext {
   readonly git: SimpleGit;
}

export async function createTestContext (): Promise<SimpleGitTestContext> {

   const context = Object.defineProperties(
      await baseCreateTestContext(),
      {
         git: {
            get () {
               return newSimpleGit(context.root);
            }
         }
      }
   );

   return context;
}

