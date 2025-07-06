import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { GitPluginError } from '../..';

describe('timeout', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('kills processes after a timeout', async () => {
      const upstream = await newSimpleGit(__dirname).revparse('--git-dir');

      const git = newSimpleGit({
         baseDir: context.root,
         timeout: {
            block: 1,
         },
      });

      const threw = await promiseError(git.raw('clone', upstream, '.'));
      assertGitError(threw, 'block timeout reached', GitPluginError);
   });
});
