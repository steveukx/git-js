import simpleGit, {
   CleanOptions,
   CleanSummary,
   GitResponseError,
   MergeSummary,
   SimpleGit,
   TaskConfigurationError
} from 'simple-git';
import {
   createSingleConflict,
   createTestContext,
   setUpConflicted,
   setUpInit,
   SimpleGitTestContext
} from '../__fixtures__';

describe('TS consume root export', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());
   beforeEach(() => setUpInit(context));

   it('log types', () => {
      expect(simpleGit().log<{ message: string }>({n: 10, format: {message: 'something'}})).not.toBeFalsy();
   });

   it('imports', () => {
      expect(typeof simpleGit).toBe('function');
      expect(CleanOptions).toEqual(expect.objectContaining({
         'FORCE': 'f',
      }));
   });

   it('finds types, enums and errors', async () => {
      await setUpInit(context);
      const git: SimpleGit = simpleGit(context.root);
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

   it('handles exceptions', async () => {
      const git: SimpleGit = simpleGit(context.root);

      await setUpConflicted(context);
      const branchName = await createSingleConflict(context);
      let wasError = false;

      const mergeSummary: MergeSummary = await git.merge([branchName])
         .catch((e: Error | GitResponseError<MergeSummary>) => {
            if (e instanceof GitResponseError) {
               wasError = true;
               return e.git;
            }

            throw e;
         });

      expect(wasError).toBe(true);
      expect(mergeSummary.conflicts).toHaveLength(1);
      expect(String(mergeSummary)).toBe('CONFLICTS: aaa.txt:content');
   })

});
