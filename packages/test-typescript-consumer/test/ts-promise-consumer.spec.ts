import simpleGit, { CleanOptions, SimpleGit } from 'simple-git/promise';

describe('simple-git/promise', () => {

   describe('default export', () => {
      it('is the simple-git factory', async () => {
         expect(await simpleGit().checkIsRepo()).toBe(true);
      });

      it('builds exported types', async () => {
         const git: SimpleGit = simpleGit();

         expect(git).not.toBeUndefined();
      });
   });

   it('default export is the simple-git factory', async () => {
      expect(await simpleGit().checkIsRepo()).toBe(true);
   });

   it('named type exports', async () => {
      const git: SimpleGit = simpleGit();

      expect(git).not.toBeUndefined();
   });

   it('named enums', async () => {
      expect(CleanOptions.DRY_RUN).toBe('n');
   });

});
