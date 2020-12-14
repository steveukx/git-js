import { promiseError, promiseResult } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit, SimpleGitTestContext, wait } from '../__fixtures__';

describe('change-directory', () => {

   let context: SimpleGitTestContext;
   let goodDir: string;
   let badDir: string;

   beforeEach(async () => context = await createTestContext());
   beforeEach(async () => {
      goodDir = await context.dir('good');
      badDir = await context.path('good', 'bad');
   });

   it('switches into new directory - happy path promise', async () => {
      const result = await promiseResult(newSimpleGit(context.root).cwd(goodDir));
      expect(result).toEqual(expect.objectContaining({
         success: true,
         threw: false,
         result: goodDir,
      }));
   });

   it('switches into new directory - sad path promise', async () => {
      const result = await promiseError(newSimpleGit(context.root).cwd(badDir));
      assertGitError(result, badDir);
   });

   it('switches into new directory - chained with callbacks', async () => {
      const spies = [jest.fn(), jest.fn(), jest.fn()];

      newSimpleGit(context.root)
         .cwd(goodDir, spies[0])
         .cwd(badDir, spies[1])
         .cwd(goodDir, spies[2]);

      await wait(250);

      expect(spies[0]).toHaveBeenCalledWith(null, goodDir);
      expect(spies[1]).toHaveBeenCalledWith(expect.any(Error));
      expect(spies[2]).not.toHaveBeenCalled();

   });
})
