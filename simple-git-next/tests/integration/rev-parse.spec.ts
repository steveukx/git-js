import {
   createTestContext,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('rev-parse', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await setUpFilesAdded(context, ['file.txt']);
   });

   it('gets the commit hash for HEAD, responds with a trimmed string', async () => {
      const actual = await newSimpleGit(context.root).revparse(['HEAD']);
      expect(actual).toBe(String(actual).trim());
   });

   it('gets the repo root', async () => {
      const actual = await newSimpleGit(context.root).revparse(['--show-toplevel']);
      expect(actual).toBe(context.rootResolvedPath);
   });
});
