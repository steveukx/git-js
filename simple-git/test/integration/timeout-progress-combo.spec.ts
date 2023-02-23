import {promiseError} from "@kwsites/promise-result";
import {assertGitError, createTestContext, newSimpleGit, SimpleGitTestContext} from "@simple-git/test-utils";

import {GitPluginError} from '../..';

describe('timeout-progress-combo', () => {

   let context: SimpleGitTestContext;
   const url = 'https://github.com/nodejs/node';
   const progress = ({method, stage, progress}) => {
      console.log(`git.${method} ${stage} stage ${progress}% complete`);
   };
   const timeout = {
      block: 5000,
   };

   jest.setTimeout(10 * 1000);

   beforeEach(async () => (context = await createTestContext()));

   it('succeeds', async () => {
      const options = {
         baseDir: context.root,
         timeout,
         progress,
      };

      const threw = await promiseError(newSimpleGit(options).clone(url));
      assertGitError(threw, 'block timeout reached', GitPluginError);
   });

   it('fails', async () => {
      const options = {
         baseDir: context.root,
         timeout,
      };

      const threw = await promiseError(newSimpleGit(options).clone(url));
      assertGitError(threw, 'block timeout reached', GitPluginError);
   });

});
