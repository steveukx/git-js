import { filesAdded, initRepo } from '@simple-git/test-utils';
import { createTestContext, newSimpleGit, SimpleGitTestContext } from '../__fixtures__';

describe('rev-parse', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());
   beforeEach(async () => {
      await initRepo(context);
      await filesAdded(context, ['file.txt']);
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
