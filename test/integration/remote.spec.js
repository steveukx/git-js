const Test = require('./include/runner');

const setUp = (context) => {
   return context.gitP(context.root).init();
};

describe('remote', () => {

   let context;
   let REMOTE_URL_ROOT = 'https://github.com/steveukx';
   let REMOTE_URL = `${ REMOTE_URL_ROOT }/git-js.git`;

   beforeEach(() => setUp(context = Test.createContext()));

   it('adds and removes named remotes', async () => {
      const {gitP, root} = context;
      await gitP(root).addRemote('remote-name', REMOTE_URL);

      expect(await gitP(root).getRemotes(true)).toEqual([
         {name: 'remote-name', refs: {fetch: REMOTE_URL, push: REMOTE_URL}},
      ]);

      await gitP(root).removeRemote('remote-name');
      expect(await gitP(root).getRemotes(true)).toEqual([]);
   });

   it('allows setting the remote url', async () => {
      const {gitP, root} = context;
      const git = gitP(root);

      let repoName = 'origin';
      let initialRemoteRepo = `${REMOTE_URL_ROOT}/initial.git`;
      let updatedRemoteRepo = `${REMOTE_URL_ROOT}/updated.git`;

      await git.addRemote(repoName, initialRemoteRepo);
      expect(await git.getRemotes(true)).toEqual([
         {name: repoName, refs: {fetch: initialRemoteRepo, push: initialRemoteRepo}},
      ]);

      await git.remote(['set-url', repoName, updatedRemoteRepo]);
      expect(await git.getRemotes(true)).toEqual([
         {name: repoName, refs: {fetch: updatedRemoteRepo, push: updatedRemoteRepo}},
      ]);

   });

})
