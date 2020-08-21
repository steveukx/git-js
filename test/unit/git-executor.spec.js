const {restore, newSimpleGit, childProcessEmits, wait} = require('./include/setup');

describe('git-executor', () => {
   let git, callback, task;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });
   afterEach(() => restore());

   async function thenTheTaskHasCompleted () {
      expect(callback).toHaveBeenCalledWith(null, await task);
      expect(callback).toHaveBeenCalledTimes(1);
   }

   function givenTheTaskIsAdded () {
      task = git.init(callback);
   }

   it('caters for close event with no exit', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('close', 'some data', 0);

      await thenTheTaskHasCompleted()
   });

   it('caters for exit with no close', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('exit', 'some data', 0);

      await thenTheTaskHasCompleted()
   });

   it('caters for close and exit', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('close', 'some data', 0);
      await childProcessEmits('exit', 'some data', 0);

      await thenTheTaskHasCompleted()
   });
});
