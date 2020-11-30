import { newSimpleGit } from './__fixtures__';
import { SimpleGit } from 'typings';

const {restore, childProcessEmits} = require('./include/setup');

describe('git-executor', () => {
   let git: SimpleGit;
   let callback: jest.Mock;
   let task: Promise<any>;

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
