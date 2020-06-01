import { gitP, CleanOptions, CleanSummary, SimpleGit, TaskConfigurationError } from 'simple-git';

const Test: any = require('../integration/include/runner');

describe('TS Root Consumer', () => {

   let context: any;

   beforeEach(() => context = Test.createContext());

   it('imports', () => {
      expect(typeof gitP).toBe('function');
      expect(CleanOptions).toEqual(expect.objectContaining({
         'FORCE': 'f',
      }));
   });

   it('finds types, enums and errors', async () => {
      const git: SimpleGit = gitP(context.root);
      await git.init();
      await context.fileP('file.txt', 'content');

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
