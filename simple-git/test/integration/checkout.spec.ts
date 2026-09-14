import { promiseError } from '@kwsites/promise-result';
import {
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
   setUpInit,
} from '@simple-git/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import type { SimpleGit } from '../../src/typings';

describe('checkout', () => {
   let context: SimpleGitTestContext;
   let git: SimpleGit;

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
