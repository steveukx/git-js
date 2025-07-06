import {
   createTestContext,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('commit', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.files('hello', 'world');
      await context.git.add('.');
   });

   it('details full commit hashes', async () => {
      const result = await newSimpleGit(context.root).commit('commit message');

      expect(result.commit.length).toBeGreaterThan(10);
      expect(result.commit).toEqual(await context.git.revparse('HEAD'));
   });
});
