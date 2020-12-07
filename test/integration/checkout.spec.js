import { promiseError } from "@kwsites/promise-result";

const {createTestContext, setUpInit} = require('../helpers');

describe('checkout', () => {

   let context, git;

   beforeEach(async () => {
      context = createTestContext();
      await setUpInit(context);
      git = context.git(context.root);
   });

   it('checkoutLocalBranch', async () => {
      const {current: initialBranch} = await git.status();

      expect(await promiseError(git.checkoutLocalBranch('my-new-branch'))).toBeUndefined();

      const {current: finalBranch} = await git.status();
      expect(finalBranch).toBe('my-new-branch');
      expect(finalBranch).not.toBe(initialBranch);
   });


});
