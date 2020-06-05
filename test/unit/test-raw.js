
const {theCommandRun, theCommandsRun, restore, Instance, closeWithSuccess, wait} = require('./include/setup');

describe('raw', () => {

   let git;

   jest.mock('../../src/lib/git-logger', () => require('./__mocks__/mock-git-logger'));

   beforeEach(() => { git = Instance(); });
   afterEach(() => restore());

   it('accepts an array of arguments', () => new Promise(done => {
      git.raw(['abc', 'def'], function (err, result) {
         expect(err).toBeNull();
         expect(result).toBe('passed through raw response');
         expect(theCommandRun()).toEqual(['abc', 'def']);

         done();
      });
      closeWithSuccess('passed through raw response');
   }));

   it('accepts an options object', () => new Promise(done => {
      git.raw({'abc': 'def'}, function (err, result) {
         expect(err).toBeNull();
         expect(result).toBe('another raw response');
         expect(theCommandRun()).toEqual(['abc=def']);

         done();
      });
      closeWithSuccess('another raw response');
   }));

   it('treats empty options as an error', async () => {
      const callback = jest.fn(err => expect(err).toBeInstanceOf(Error));
      git.raw([], callback);

      await wait();
      expect(callback).toHaveBeenCalled();
      expect(theCommandsRun()).toHaveLength(0);
   });


   it('does not require a callback in success', async () => {
      expect(theCommandsRun()).toHaveLength(0);
      git.raw(['something']);

      expect(theCommandsRun()).toHaveLength(0);
      await closeWithSuccess();

      expect(theCommandRun()).toEqual(['something']);
   });

})
