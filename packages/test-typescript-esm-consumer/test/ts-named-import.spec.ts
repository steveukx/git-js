import { simpleGit, CleanOptions, SimpleGit, TaskConfigurationError } from 'simple-git';

describe('simple-git', () => {

   describe('named export', () => {
      it('is the simple-git factory', async () => {
         expect(await simpleGit().checkIsRepo()).toBe(true);
      });

      it('builds exported types', async () => {
         const git: SimpleGit = simpleGit();

         expect(git).not.toBeUndefined();
      });
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
