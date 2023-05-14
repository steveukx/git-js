import {
   createTestContext,
   like,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('add', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.files('aaa.txt', 'bbb.txt', 'ccc.other');
   });

   it('adds a single file', async () => {
      await context.git.add('aaa.txt');
      expect(await newSimpleGit(context.root).status()).toEqual(
         like({
            created: ['aaa.txt'],
            not_added: ['bbb.txt', 'ccc.other'],
         })
      );
   });

   it('adds multiple files explicitly', async () => {
      await context.git.add(['aaa.txt', 'ccc.other']);

      expect(await newSimpleGit(context.root).status()).toEqual(
         like({
            created: ['aaa.txt', 'ccc.other'],
            not_added: ['bbb.txt'],
         })
      );
   });

   it('adds multiple files by wildcard', async () => {
      await context.git.add('*.txt');

      expect(await newSimpleGit(context.root).status()).toEqual(
         like({
            created: ['aaa.txt', 'bbb.txt'],
            not_added: ['ccc.other'],
         })
      );
   });
});
