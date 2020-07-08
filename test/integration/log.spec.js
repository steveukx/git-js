const {createTestContext, setUpInit, setUpFilesCreated} = require('../helpers');

describe('log', () => {
   let context, commitResult, userName, userEmail, repo;

   beforeEach(async () => {
      context = createTestContext();
      repo = context.git(context.root);

      await setUpInit(context);
      await setUpFilesCreated(context, ['a.txt', 'b.txt']);
      await repo.add('a.txt');
      await repo.commit('commit line one\ncommit line two\n');
      await repo.add('b.txt');

      commitResult = await repo.commit('commit on one line');
      userName = String(await repo.raw('config', 'user.name')).trim();
      userEmail = String(await repo.raw('config', 'user.email')).trim();
   });

   it('multi-line commit message in log summary', async () => {
      const actual = await context.git(context.root).log({multiLine: true});
      expect(actual).toEqual(expect.objectContaining({
         latest: expect.objectContaining({
            refs: 'HEAD -> master',
            body: 'commit on one line\n',
            author_name: userName,
            author_email: userEmail,
         }),
      }));
      expect(actual.latest).toEqual(actual.all[0]);
   });

   it('multi-line commit message in custom format log summary', async () => {
      const options = {format: {refs: '%D', body: '%B', message: '%s'}, splitter: '||'};
      const actual = await context.git(context.root).log(options);

      expect(actual.all).toEqual([
         expect.objectContaining({
            body: 'commit on one line\n',
            refs: 'HEAD -> master',
            message: 'commit on one line',
         }),
         expect.objectContaining({
            body: 'commit line one\ncommit line two\n',
            refs: '',
            message: 'commit line one commit line two',
         }),
      ]);
   });

   it('should read one line for each commit when using shortstat', async () => {
      const options = ['--shortstat'];
      const actual = await context.git(context.root).log(options);

      expect(actual.all).toHaveLength(2);
   });
});
