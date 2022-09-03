import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('version', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('gets the current version', async () => {
      const git = newSimpleGit(context.root);
      expect(await git.version()).toEqual({
         major: 2,
         minor: expect.any(Number),
         patch: expect.any(Number),
         agent: expect.any(String),
         installed: true,
      });
   });

   it('gets the current version when the binary is not installed', async () => {
      const git = newSimpleGit(context.root).customBinary('bad');
      expect(await git.version()).toEqual({
         major: 0,
         minor: 0,
         patch: 0,
         agent: '',
         installed: false,
      });
   });
});
