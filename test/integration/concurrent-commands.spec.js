const {createTestContext} = require('../helpers');

describe('concurrent commands', () => {
   let context;

   async function configure (dir) {
      const git = context.git(context.dir(dir));
      await context.fileP(dir, dir, '');
      await git.init();
      await git.add('.');
      await git.commit(`first commit: ${dir}`);
      await git.raw('checkout', '-b', dir);
   }

   beforeEach(async () => {
      context = createTestContext();
      await configure('first');
      await configure('second');
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
      return context.git(context.dir(dir)).branchLocal()
         .then((result) => result.current);
   }

})
