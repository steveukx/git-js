import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('checkout', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
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

   describe('checkoutLocalBranch', () => {
      it('allows using -B', async () => {
         git.checkoutLocalBranch('foo', { '-B': null });
         await closeWithSuccess();

         assertExecutedCommands('checkout', '-B', 'foo');
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

      it('as promise', async () => {
         const result = git.checkoutBranch('abc', 'def');

         await closeWithSuccess();
         expect(await result).toEqual(expect.any(String));
         assertExecutedCommands('checkout', '-b', 'abc', 'def');
      });
   });
});
