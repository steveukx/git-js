import {
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
} from '../__fixtures__/integration';

describe('exec', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
   });

   it('will exec a function between other chained methods', async () => {
      // v3 interleaved raw() trailing callbacks here; @simple-git/core has no
      // callbacks, so exec() is the mechanism for running a function in order
      // between chained tasks
      const calls: string[] = [];

      await newSimpleGit(context.root)
         .exec(() => calls.push('a'))
         .raw('init')
         .exec(() => calls.push('b'))
         .exec(() => calls.push('c'))
         .raw('status')
         .exec(() => calls.push('d'));

      expect(calls).toEqual(['a', 'b', 'c', 'd']);
   });
});
