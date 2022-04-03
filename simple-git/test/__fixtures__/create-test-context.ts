import { createTestContext as baseCreateTestContext, TestContext } from '@simple-git/test-utils';
import type { SimpleGit } from '../../typings';
import { newSimpleGit } from './instance';

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

