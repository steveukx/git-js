const {createTestContext, setUpInit} = require('../helpers');

describe('concurrent commands', () => {
   let contexts;

   async function configure (context, name) {
      await setUpInit(context);

      const git = context.git(context.root);
      await context.fileP(name, name, '');
      await git.add('.');
      await git.commit(`first commit: ${name}`);
      await git.raw('checkout', '-b', name);

      return context;
   }

   beforeEach(async () => {
      contexts = {
         first: await configure(createTestContext(), 'first'),
         second: await configure(createTestContext(), 'second'),
      };
   });

   it('will queue tasks to ensure all tasks run eventually', async () => {
      const tests = [
         'first', 'second', 'first', 'second', 'first', 'second',
         'second', 'first', 'second', 'first', 'second', 'first'
      ]
      const expected = [...tests];
      const actual = await Promise.all(tests.map(currentBranchForDirectory));

      expect(actual).toEqual(expected);
   });

   function currentBranchForDirectory (dir) {
      const context = contexts[dir];
      return context.git(context.root).branchLocal()
         .then((result) => result.current);
   }

})
