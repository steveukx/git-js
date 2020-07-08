const {restore, newSimpleGit, theCommandsRun, wait} = require('./include/setup');

describe('cwd', () => {

   let git;

   const { $fails: isInvalidDirectory, $reset: isValidDirectory } = require('@kwsites/file-exists');

   beforeEach(() => {git = newSimpleGit()});

   afterEach(() => restore());

   it('to a known directory', async () => {
      isValidDirectory();

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
      isInvalidDirectory();

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
