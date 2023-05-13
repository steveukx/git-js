import {
   createTestContext,
   like,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';
import { grepQueryBuilder } from '../..';

describe('run', () => {
   it('x', async () => {
      const git = newSimpleGit();
      // const grepA = await git.grep('ADDS MULTIPLE', ['--ignore-case', '--', '*.ts']);
      const grepA = await git.grep(grepQueryBuilder('ADDS MULTIPLE').path('*.ts'), [
         '--ignore-case',
      ]);

      console.log(grepA);
   });
});

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
