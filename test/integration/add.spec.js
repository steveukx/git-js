const {createTestContext, setUpInit, setUpFilesCreated} = require('../helpers');

describe('add', () => {
   let context, repo;

   beforeEach(async () => {
      context = createTestContext();
      await setUpInit(context);
      await setUpFilesCreated(context, ['aaa.txt', 'bbb.txt', 'ccc.other']);
      repo = context.git(context.root);
   });

   it('adds a single file', async () => {
      await context.git(context.root).add('aaa.txt');

      expect(await repo.status()).toEqual(expect.objectContaining({
         created: ['aaa.txt'],
         not_added: ['bbb.txt', 'ccc.other'],
      }));
   });

   it('adds multiple files explicitly', async () => {
      await context.git(context.root).add(['aaa.txt', 'ccc.other']);

      expect(await repo.status()).toEqual(expect.objectContaining({
         created: ['aaa.txt', 'ccc.other'],
         not_added: ['bbb.txt'],
      }));
   });

   it('adds multiple files by wildcard', async () => {
      await context.git(context.root).add('*.txt');

      expect(await repo.status()).toEqual(expect.objectContaining({
         created: ['aaa.txt', 'bbb.txt'],
         not_added: ['ccc.other'],
      }));
   });
});
