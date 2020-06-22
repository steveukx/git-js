const {createTestContext, setUpFilesAdded, setUpInit} = require('../helpers');
const {InitSummary} = require('../../src/lib/responses/InitSummary');
const {StatusSummary} = require('../../src/lib/responses/StatusSummary');

describe('promise', () => {

   let context;

   beforeEach(() => context = createTestContext());
   beforeEach(async () => {
      await context.fileP('file.one', 'content');
      await context.fileP('file.two', 'content');
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
