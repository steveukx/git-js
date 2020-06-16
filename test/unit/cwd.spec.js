
const {restore, newSimpleGit, theCommandsRun, wait} = require('./include/setup');

describe('cwd', () => {

   let git;

   beforeEach(() => {git = newSimpleGit()});

   afterEach(() => restore());

   it('to a known directory', async () => {
      const callback = jest.fn((err, result) => {
         expect(err).toBeNull();
         expect(result).toBe('./');
      })
      git.cwd('./', callback);

      await wait();
      expect(callback).toHaveBeenCalled();
      expect(theCommandsRun()).toHaveLength(0);
   });

   it('to an invalid directory', async () => {
      const callback = jest.fn((err) => {
         expect(err).toBeInstanceOf(Error);
         expect(err.message).toMatch('invalid_path');
      });
      git.cwd('./invalid_path', callback);

      await wait();
      expect(callback).toHaveBeenCalled();
      expect(theCommandsRun()).toHaveLength(0);
   });

});
