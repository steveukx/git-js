import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('exec', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
   });

   it('will exec a function between other chained methods', async () => {
      const calls: string[] = [];

      await newSimpleGit(context.root)
         .exec(() => calls.push('a'))
         .raw('init', () => calls.push('b'))
         .exec(() => calls.push('c'))
         .raw('init', () => calls.push('d'));

      expect(calls).toEqual(['a', 'b', 'c', 'd']);
   });
});
