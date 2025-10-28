import { createTestContext, like, setUpFilesAdded, setUpInit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('branch-show-current', () => {
   let context: SimpleGitTestContext;

   const expectedBranchSummary = (commit = '', label = '') => like({
      all: ['my-new-branch'],
      current: 'my-new-branch',
      branches: {
         'my-new-branch': {
            name: 'my-new-branch',
            commit,
            label,
            current: true,
            linkedWorkTree: false,
         },
      },
   });


   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.git.raw('checkout', '-b', 'my-new-branch');
   });

   it('should be able to show you the current on an empty repo', async () => {
      expect(await context.git.branch(['--show-current']))
         .toEqual(expectedBranchSummary());
   });

   it('should be able to show you the current on an regular repo', async () => {
      await setUpFilesAdded(context, ['some-file'], '.', 'Initial Commit');

      expect(await context.git.branch(['--show-current']))
         .toEqual(expectedBranchSummary());

      const branch = await context.git.branch();
      expect(branch).toEqual(expectedBranchSummary(
         expect.stringMatching(/^.{7}$/),
         'Initial Commit',
      ));
   });
});
