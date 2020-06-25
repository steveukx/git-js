const {createTestContext} = require('../helpers');
const {InitSummary} = require('../../src/lib/responses/InitSummary');
const {StatusSummary} = require('../../src/lib/responses/StatusSummary');

describe('promise', () => {

   let context;

   beforeEach(() => context = createTestContext());
   beforeEach(async () => {
      await context.fileP('file.one', 'content');
      await context.fileP('file.two', 'content');
   });

   it('rejects failures whether using async or promises', async () => {
      const git = context.git(context.root);

      function runUsingThen (cmd) {
         return git.raw(cmd).then(() => true, () => false);
      }

      async function runUsingAwait (cmd) {
         try {
            await git.raw(cmd);
            return true;
         } catch {
            return false;
         }
      }

      expect(await Promise.all([runUsingThen('blah'), runUsingThen('version')])).toEqual([false, true]);
      expect(await Promise.all([runUsingThen('version'), runUsingThen('blah')])).toEqual([true, false]);

      expect(await Promise.all([runUsingAwait('blah'), runUsingAwait('version')])).toEqual([false, true]);
      expect(await Promise.all([runUsingAwait('version'), runUsingAwait('blah')])).toEqual([true, false]);
   });

   it('awaits the returned task', async () => {
      let init, status, callbacks = {};
      const git = context.git(context.root);

      expect(git).not.toHaveProperty('then');
      expect(git).not.toHaveProperty('catch');

      init = git.init();
      status = init.status();

      assertArePromises(init, status);

      init.then(callbacks.init = jest.fn().mockReturnValue('HELLO'))
         .then(callbacks.initNested = jest.fn());

      status.then(callbacks.status = jest.fn());

      const actual = [await init, await status];
      expect(actual).toEqual([
         expect.any(InitSummary),
         expect.any(StatusSummary),
      ]);

      expect(callbacks.init).toBeCalledWith(actual[0]);
      expect(callbacks.initNested).toBeCalledWith('HELLO');
      expect(callbacks.status).toBeCalledWith(actual[1]);
   });

   function assertArePromises (...promises) {
      expect(promises.length).toBeGreaterThan(0);
      promises.forEach(promise => {
         expect(typeof promise.catch).toBe('function');
         expect(typeof promise.then).toBe('function');
      });
   }
});
