import { CleanOptions, CleanSummary, gitP, SimpleGit, TaskConfigurationError } from 'simple-git';
import { createTestContext, SimpleGitTestContext } from '../__fixtures__';

describe('TS Root Consumer', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());

   it('imports', () => {
      expect(typeof gitP).toBe('function');
      expect(CleanOptions).toEqual(expect.objectContaining({
         'FORCE': 'f',
      }));
   });

   it('finds types, enums and errors', async () => {
      const git: SimpleGit = gitP(context.root);
      await git.init();
      await context.file('file.txt', 'content');

      const error: TaskConfigurationError | CleanSummary = await git.clean(CleanOptions.DRY_RUN, ['--interactive'])
         .catch((e: TaskConfigurationError) => e);
      expect(error).toBeInstanceOf(Error);

      const clean: CleanSummary = await git.clean(CleanOptions.FORCE);
      expect(clean).toEqual(expect.objectContaining({
         dryRun: false,
         files: ['file.txt'],
      }));
   });

});
