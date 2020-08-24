import simpleGit, {
   CleanOptions,
   CleanSummary,
   GitResponseError,
   MergeSummary,
   SimpleGit,
   TaskConfigurationError
} from 'simple-git';

const {setUpConflicted, configureGitCommitter, createSingleConflict, createTestContext} = require('../helpers');

describe('TS consume root export', () => {

   let context: any;

   beforeEach(() => context = createTestContext());

   it('log types', () => {
      expect(simpleGit().log<{message: string}>({ n: 10, format: {message: 'something'} })).not.toBeFalsy();
   });

   it('imports', () => {
      expect(typeof simpleGit).toBe('function');
      expect(CleanOptions).toEqual(expect.objectContaining({
         'FORCE': 'f',
      }));
   });

   it('finds types, enums and errors', async () => {
      const git: SimpleGit = simpleGit(context.root);
      await git.init();
      await context.fileP('file.txt', 'content');
      await configureGitCommitter(context);

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
