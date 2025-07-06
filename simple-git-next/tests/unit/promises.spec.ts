import { closeWithError, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';
import { BranchDeletionBatch } from '../../src/lib/responses/BranchDeleteSummary';
import { CleanResponse } from '../../src/lib/responses/CleanSummary';

describe('promises', () => {
   let git: SimpleGit;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('initially resolves to itself', async () => {
      expect(await git).toBe(git);
   });

   it('is transparent to async await', async () => {
      closeWithSuccess('Removing foo/');
      expect(await git.clean('f')).toBeInstanceOf(CleanResponse);
   });

   it('errors into catch with a subsequent then', async () => {
      const callbacks = callbackArray();
      const queue = git.init().catch(callbacks.create('catcher')).then(callbacks.create('later'));
      await closeWithError();
      await queue;
      expect(callbacks.callCount).toEqual({ later: 1, catcher: 1 });
      expect(callbacks.named.later).toHaveBeenCalledWith('catcher');
   });

   it('resolves over catch into subsequent then', async () => {
      const callbacks = callbackArray();
      const queue = git.init().catch(callbacks.create('catcher')).then(callbacks.create('later'));
      await closeWithSuccess();
      await queue;
      expect(callbacks.callCount).toEqual({ later: 1, catcher: 0 });
   });

   it('then with a subsequent catch handler', async () => {
      const callbacks = callbackArray();
      const queue = git
         .init()
         .then(callbacks.create('resolve'))
         .catch(callbacks.create('catcher'))
         .then(callbacks.create('after'));
      await closeWithError();
      await queue;
      expect(callbacks.callCount).toEqual({ resolve: 0, after: 1, catcher: 1 });
      expect(callbacks.named.after).toHaveBeenCalledWith('catcher');
   });

   it('then with a rejection handler', async () => {
      const callbacks = callbackArray();
      const queue = git
         .init()
         .then(callbacks.create('resolve'), callbacks.create('reject'))
         .then(callbacks.create('after'))
         .catch(callbacks.create('catcher'));
      await closeWithError();
      await queue;
      expect(callbacks.callCount).toEqual({ reject: 1, resolve: 0, after: 1, catcher: 0 });
      expect(callbacks.named.after).toHaveBeenCalledWith('reject');
   });

   it('uses the promise from the the latest task', async () => {
      const callbacks = callbackArray();
      const queues = [
         git.clean('f').then(callbacks.create('clean')),
         git.deleteLocalBranches(['feature/something']).then(callbacks.create('branch')),
      ];

      await closeWithSuccess('Removing foo/');
      await closeWithSuccess('Deleted branch feature/something (was abcdefg).');

      const results = await Promise.all(queues);
      expect(results).toEqual(['clean', 'branch']);
      expect(callbacks.allCalledOnce).toBe(true);
      expect(callbacks.named.clean).toHaveBeenCalledWith(expect.any(CleanResponse));
      expect(callbacks.named.branch).toHaveBeenCalledWith(expect.any(BranchDeletionBatch));
   });

   function callbackArray(callbacks: jest.Mock[] = []) {
      const resolveMock = (c: jest.Mock) => c;
      const resolveMockCallCount = (c: jest.Mock) => c.mock.calls.length;

      function byName<T>(resolver: (c: jest.Mock) => T) {
         return callbacks.reduce(
            (all, callback) => {
               all[callback.getMockName()] = resolver(callback);
               return all;
            },
            {} as { [key: string]: T }
         );
      }

      return {
         create(name: string, fn = () => name) {
            return (callbacks[callbacks.length] = jest.fn(fn || (() => name)).mockName(name));
         },
         slice(from: number, to = callbacks.length) {
            return callbackArray(callbacks.slice(from, to));
         },
         get callCount() {
            return byName(resolveMockCallCount);
         },
         get allCalledOnce() {
            return callbacks.every((callback) => callback.mock.calls.length === 1);
         },
         get named() {
            return byName(resolveMock);
         },
      };
   }
});

describe('async generator', () => {
   it('git can be returned from a promise based getter', async () => {
      const factory = {
         async getGit() {
            return newSimpleGit();
         },
         async doSomething() {
            const git = await factory.getGit();
            return await git.raw(['init']);
         },
      };

      closeWithSuccess('the response');
      expect(await factory.doSomething()).toEqual('the response');
   });
});
