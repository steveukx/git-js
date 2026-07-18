import { promiseError } from '@kwsites/promise-result';

import type { SimpleGitCore } from '../../index';
import {
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
   setUpInit,
} from '../__fixtures__/integration';

describe('checkout', () => {
   let context: SimpleGitTestContext;
   let git: SimpleGitCore;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.files('aaa.txt', 'bbb.txt', 'ccc.other');
      git = newSimpleGit(context.root);
   });

   it('checkoutLocalBranch', async () => {
      const { current: initialBranch } = await git.status();

      expect(await promiseError(git.checkoutLocalBranch('my-new-branch'))).toBeUndefined();

      const { current: finalBranch } = await git.status();
      expect(finalBranch).toBe('my-new-branch');
      expect(finalBranch).not.toBe(initialBranch);
   });
});
