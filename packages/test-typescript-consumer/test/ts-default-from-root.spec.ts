import simpleGit, { gitP, CleanOptions, SimpleGit, TaskConfigurationError } from 'simple-git';

describe('simple-git', () => {

   describe('default export', () => {
      it('is the simple-git factory', async () => {
         expect(await simpleGit().checkIsRepo()).toBe(true);
      });

      it('builds exported types', async () => {
         const git: SimpleGit = simpleGit();

         expect(git).not.toBeUndefined();
      });
   });

   describe('gitP export', () => {
      it('is the simple-git factory', async () => {
         expect(await gitP().checkIsRepo()).toBe(true);
      });

      it('builds exported types', async () => {
         const git: SimpleGit = gitP();

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

   it('named class constructors', async () => {
      expect(new TaskConfigurationError('foo')).toBeInstanceOf(TaskConfigurationError);
   });

   it('named enums', async () => {
      expect(CleanOptions.DRY_RUN).toBe('n');
   });

});
