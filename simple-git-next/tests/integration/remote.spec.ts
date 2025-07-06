import {
   createTestContext,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('remote', () => {
   let context: SimpleGitTestContext;
   let REMOTE_URL_ROOT = 'https://github.com/steveukx';
   let REMOTE_URL = `${REMOTE_URL_ROOT}/git-js.git`;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
   });

   it('adds and removes named remotes', async () => {
      const git = newSimpleGit(context.root).addRemote('remote-name', REMOTE_URL);

      expect(await git.getRemotes(true)).toEqual([
         { name: 'remote-name', refs: { fetch: REMOTE_URL, push: REMOTE_URL } },
      ]);

      await git.removeRemote('remote-name');
      expect(await git.getRemotes(true)).toEqual([]);
   });

   it('allows setting the remote url', async () => {
      const git = newSimpleGit(context.root);

      let repoName = 'origin';
      let initialRemoteRepo = `${REMOTE_URL_ROOT}/initial.git`;
      let updatedRemoteRepo = `${REMOTE_URL_ROOT}/updated.git`;

      await git.addRemote(repoName, initialRemoteRepo);
      expect(await git.getRemotes(true)).toEqual([
         { name: repoName, refs: { fetch: initialRemoteRepo, push: initialRemoteRepo } },
      ]);

      await git.remote(['set-url', repoName, updatedRemoteRepo]);
      expect(await git.getRemotes(true)).toEqual([
         { name: repoName, refs: { fetch: updatedRemoteRepo, push: updatedRemoteRepo } },
      ]);
   });
});
