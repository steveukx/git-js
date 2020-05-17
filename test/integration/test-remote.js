const Test = require('./include/runner');

const setUp = (context) => {
   return context.gitP(context.root).init();
};

describe('remote', () => {

   let context;
   let REMOTE_URL = 'https://github.com/steveukx/git-js.git';

   beforeEach(() => setUp(context = Test.createContext()));

   it('adds and removes named remotes', async () => {
      const {gitP, root} = context;
      await gitP(root).addRemote('remote-name', REMOTE_URL);

      expect(await gitP(root).getRemotes(true)).toEqual([
         { name: 'remote-name', refs: { fetch: REMOTE_URL, push: REMOTE_URL }},
      ]);

      await gitP(root).removeRemote('remote-name');
      expect(await gitP(root).getRemotes(true)).toEqual([]);
   });

})
