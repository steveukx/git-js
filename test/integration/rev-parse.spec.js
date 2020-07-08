const {createTestContext, setUpInit, setUpFilesAdded} = require('../helpers');

describe('rev-parse', () => {
   let context;

   beforeEach(async () => {
      context = createTestContext();
      await setUpInit(context);
      await setUpFilesAdded(context, ['file.txt']);
   });

   it('gets the commit hash for HEAD', async () => {
      const actual = await context.git(context.root).revparse(['HEAD']);
      expect(actual).toBe(String(actual).trim());
   });

   it('gets the repo root', async () => {
      const actual = await context.git(context.root).revparse(['--show-toplevel']);
      expect(actual).toBe(context.rootResolvedPath);
   });

});
