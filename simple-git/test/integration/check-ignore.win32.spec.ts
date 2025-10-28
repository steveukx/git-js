import { createTestContext, setUpIgnored, setUpInit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('checkIgnore', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await setUpIgnored(context, ['ignored', 'partially/untracked']);
   });

   it('detects ignored files', async () => {
      const actual = await context.git.checkIgnore([
         'ignored/anything',
         'tracked/anything',
         'partially/tracked',
         'partially/untracked/file',
      ]);

      expect(actual).toEqual([
         'ignored/anything',
         'partially/untracked/file',
      ]);
   });
});
