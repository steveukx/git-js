import { SimpleGit } from 'typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit, wait } from './__fixtures__';

describe('checkout', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('checkout with trailing options array', async () => {
      const queue = git.checkout('something', ['--track', 'upstream/something']);

      await closeWithSuccess();
      await queue;

      assertExecutedCommands('checkout', 'something', '--track', 'upstream/something');
   });

   it('checkout with trailing options object', async () => {
      const queue = git.checkout('something', { '--track': null, 'upstream/something': null });

      await closeWithSuccess();
      await queue;

      assertExecutedCommands('checkout', 'something', '--track', 'upstream/something');
   });

   it('checkout with just trailing options array', async () => {
      const queue = git.checkout(['-b', 'foo']);

      await closeWithSuccess();
      await queue;

      assertExecutedCommands('checkout', '-b', 'foo');
   });

   it('checkout with just trailing options object', async () => {
      const queue = git.checkout({ '-b': null, 'my-branch': null });

      await closeWithSuccess();
      await queue;

      assertExecutedCommands('checkout', '-b', 'my-branch');
   });

   it('simple checkout with callback', async function () {
      git.checkout('something', callback);

      await closeWithSuccess();
      await wait();

      expect(callback).toHaveBeenCalledWith(null, expect.any(String));
      assertExecutedCommands('checkout', 'something');
   });

   describe('checkoutLocalBranch', () => {
      it('allows using -B', async () => {
         git.checkoutLocalBranch('foo', { '-B': null });
         await closeWithSuccess();

         assertExecutedCommands('checkout', '-B', 'foo');
      });

      it('with callback', async () => {
         git.checkoutLocalBranch('new-branch', callback);
         await closeWithSuccess();
         await wait();

         expect(callback).toHaveBeenCalledWith(null, expect.any(String));
         assertExecutedCommands('checkout', '-b', 'new-branch');
      });

      it('as promise', async () => {
         const queue = git.checkoutLocalBranch('new-branch');
         await closeWithSuccess();
         await queue;

         assertExecutedCommands('checkout', '-b', 'new-branch');
      });
   });

   describe('checkoutBranch', () => {
      it('allows using -B', async () => {
         git.checkoutBranch('foo', 'bar', ['-B']);
         await closeWithSuccess();

         assertExecutedCommands('checkout', '-B', 'foo', 'bar');
      });

      it('with callback', async function () {
         git.checkoutBranch('branch', 'start', callback);

         await closeWithSuccess();
         await wait();

         expect(callback).toHaveBeenCalledWith(null, expect.any(String));
         assertExecutedCommands('checkout', '-b', 'branch', 'start');
      });

      it('as promise', async function () {
         const result = git.checkoutBranch('abc', 'def');

         await closeWithSuccess();
         expect(await result).toEqual(expect.any(String));
         assertExecutedCommands('checkout', '-b', 'abc', 'def');
      });
   });
});
