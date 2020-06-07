const {theCommandsRun, restore, Instance, closeWithSuccess, closeWithError} = require('./include/setup');
const {BranchDeletion} = require('../../src/lib/responses/BranchDeleteSummary');
const {CleanResponse} = require('../../src/lib/responses/CleanSummary');

describe('promises', () => {

   let git;

   beforeEach(() => {
      git = Instance();
   });

   afterEach(() => restore());

   it('is transparent to async away', async () => {
      closeWithSuccess('Removing foo/');
      const cleanSummary = await git.clean('f');
      expect(cleanSummary).toBeInstanceOf(CleanResponse);
   });

   it('errors into catch with a subsequent then', async () => {
      const callbacks = callbackArray();
      const queue = git.init()
         .catch(callbacks.create('catcher'))
         .then(callbacks.create('later'))
      ;

      await closeWithError();
      await queue;
      expect(callbacks.callCount).toEqual({later: 1, catcher: 1});
      expect(callbacks.named.later).toHaveBeenCalledWith('catcher');
   });

   it('resolves over catch into subsequent then', async () => {
      const callbacks = callbackArray();
      const queue = git.init()
         .catch(callbacks.create('catcher'))
         .then(callbacks.create('later'))
      ;

      await closeWithSuccess();
      await queue;
      expect(callbacks.callCount).toEqual({later: 1, catcher: 0});
   });

   it('then with a subsequent catch handler', async () => {
      const callbacks = callbackArray();
      const queue = git.init()
         .then(callbacks.create('resolve'))
         .catch(callbacks.create('catcher'))
         .then(callbacks.create('after'))
      ;

      await closeWithError();
      await queue;
      expect(callbacks.callCount).toEqual({resolve: 0, after: 1, catcher: 1});
      expect(callbacks.named.after).toHaveBeenCalledWith('catcher');
   });

   it('then with a rejection handler', async () => {
      const callbacks = callbackArray();
      const queue = git.init()
         .then(callbacks.create('resolve'), callbacks.create('reject'))
         .then(callbacks.create('after'))
         .catch(callbacks.create('catcher'))
      ;

      await closeWithError();
      await queue;
      expect(callbacks.callCount).toEqual({reject: 1, resolve: 0, after: 1, catcher: 0});
      expect(callbacks.named.after).toHaveBeenCalledWith('reject');
   });

   it('uses the promise from the the latest task', async () => {
      const callbacks = callbackArray();
      const queues = [
         git.clean('f').then(callbacks.create('clean')),
         git.deleteLocalBranch('feature/something').then(callbacks.create('branch')),
      ];

      await closeWithSuccess('Removing foo/');
      await closeWithSuccess('Deleted branch feature/something (was abcdefg).');

      const results = await Promise.all(queues);
      expect(results).toEqual(['clean', 'branch']);
      expect(callbacks.allCalledOnce).toBe(true);
      expect(callbacks.named.clean).toHaveBeenCalledWith(expect.any(CleanResponse));
      expect(callbacks.named.branch).toHaveBeenCalledWith(expect.any(BranchDeletion));

   });

   function expectToHaveRun (count) {
      return {
         task () {
            expect(theCommandsRun()).toHaveLength(count);
         },
         tasks () {
            expect(theCommandsRun()).toHaveLength(count);
         }
      }
   }

   function deferred () {
      let reject, resolve;
      const promise = new Promise((_resolve, _reject) => {
         resolve = _resolve;
         reject = _reject;
      });

      return {
         reject (value) {
            reject(value);
         },
         resolve (value) {
            resolve(value);
         },
         get promise () {
            return promise;
         }
      };

   }

   function callbackArray () {
      let api;
      const callbacks = [].slice.call(arguments);
      const callbackCallCount = (callback) => callback.mock.calls.length;
      const byName = (resolver) => callbacks.reduce((all, callback) => {
         all[callback.getMockName()] = resolver ? resolver(callback) : callback;
         return all;
      }, {});

      return api = {
         create () {
            const args = [].slice.call(arguments);
            const fn = typeof args[0] === 'function' && args.shift();
            const name = typeof args[0] === 'string' ? args.shift() : `mock${ String.fromCharCode(65 + callbacks.length) }`;

            return callbacks[callbacks.length] = jest.fn(fn || (() => name)).mockName(name);
         },
         slice (from, to) {
            return callbackArray.apply(null, callbacks.slice(from, to === undefined ? callbacks.length : to));
         },
         calledWith () {
            const what = [].slice.call(arguments);
            callbacks.forEach(callback => expect(callback.mock.calls).toContainEqual(what));
            return true;
         },
         get callCount () {
            return byName(callbackCallCount);
         },
         get allCalledOnce () {
            return callbacks.every(callback => callback.mock.calls.length === 1);
         },
         get named () {
            return byName();
         },
      }
   }

})
