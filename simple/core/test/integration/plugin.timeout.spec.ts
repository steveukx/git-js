import { promiseError } from '@kwsites/promise-result';

import { GitPluginError } from '../../index';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
} from '../__fixtures__/integration';

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
