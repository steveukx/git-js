const {assertGitError, createTestContext, promiseError, promiseResult, wait} = require('../helpers');

describe('change-directory', () => {
   let context, goodDir, badDir;

   beforeEach(async () => {
      context = createTestContext();
      goodDir = context.dir('good');
      badDir = context.filePath('good', 'bad');
   });

   it('switches into new directory - happy path promise', async () => {
      const result = await promiseResult(context.git(context.root).cwd(goodDir));
      expect(result).toEqual(expect.objectContaining({
         success: true,
         threw: false,
         result: goodDir,
      }));
   });

   it('switches into new directory - sad path promise', async () => {
      const result = await promiseError(context.git(context.root).cwd(badDir));
      assertGitError(result, badDir);
   });

   it('switches into new directory - chained with callbacks', async () => {
      const spies = [jest.fn(), jest.fn(), jest.fn()];

      context.git(context.root)
         .cwd(goodDir, spies[0])
         .cwd(badDir, spies[1])
         .cwd(goodDir, spies[2]);

      await wait(250);

      expect(spies[0]).toHaveBeenCalledWith(null, goodDir);
      expect(spies[1]).toHaveBeenCalledWith(expect.any(Error));
      expect(spies[2]).not.toHaveBeenCalled();

   });
})
