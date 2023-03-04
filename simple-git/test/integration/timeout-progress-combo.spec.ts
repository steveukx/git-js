import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { GitPluginError, SimpleGitOptions } from '../..';

describe('timeout-progress-combo', () => {
   let context: SimpleGitTestContext;
   const url = 'https://github.com/nodejs/node';
   const progress: SimpleGitOptions['progress'] = jest.fn();
   const timeout: SimpleGitOptions['timeout'] = {
      block: 5000,
      stdOut: true,
      stdErr: false,
   };

   jest.setTimeout(10 * 1000);

   beforeEach(async () => (context = await createTestContext()));

   it('succeeds', async () => {
      const options: Partial<SimpleGitOptions> = {
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
