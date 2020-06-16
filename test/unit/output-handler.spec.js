const {Instance, closeWithSuccess} = require('./include/setup');

describe('outputHandler', () => {

   let git;

   beforeEach(() => { git = Instance(); });

   it('passes name of command to callback', async () => {
      const handler = jest.fn();
      const queue = git.outputHandler(handler).init();

      closeWithSuccess();
      await queue;

      expect(handler).toHaveBeenCalledWith(
         'git', expect.any(Object), expect.any(Object), ['init']
      );
   });

   it('passes name of command to callback - custom binary', async () => {
      const handler = jest.fn();
      const queue = git.outputHandler(handler).customBinary('something').init();

      closeWithSuccess();
      await queue;

      expect(handler).toHaveBeenCalledWith(
         'something', expect.any(Object), expect.any(Object), ['init']
      );
   });

})
