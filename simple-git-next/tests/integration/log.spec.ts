import { promiseResult } from '@kwsites/promise-result';
import {
   createTestContext,
   GIT_USER_EMAIL,
   GIT_USER_NAME,
   like,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';
import type { DiffResultTextFile } from '../../typings';

describe('log', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
      await setUpFilesAdded(context, ['a.txt'], 'a.txt', 'commit line one\ncommit line two\n');
      await setUpFilesAdded(context, ['b.txt'], 'b.txt', 'commit on one line');
   });

   it('multi-line commit message in log summary', async () => {
      const actual = await newSimpleGit(context.root).log({ multiLine: true });
      expect(actual).toEqual(
         like({
            latest: like({
               refs: 'HEAD -> master',
               body: 'commit on one line\n',
               author_name: GIT_USER_NAME,
               author_email: GIT_USER_EMAIL,
            }),
         })
      );
      expect(actual.latest).toEqual(actual.all[0]);
   });

   it('multi-line commit message in custom format log summary', async () => {
      const options = { format: { refs: '%D', body: '%B', message: '%s' }, splitter: '||' };
      const actual = await newSimpleGit(context.root).log(options);

      expect(actual.all).toEqual([
         like({
            body: 'commit on one line\n',
            refs: 'HEAD -> master',
            message: 'commit on one line',
         }),
         like({
            body: 'commit line one\ncommit line two\n',
            refs: '',
            message: 'commit line one commit line two',
         }),
      ]);
   });

   describe('log formats', () => {
      const a = 'a.txt';
      const b = 'b.txt';

      function file(file: string, changes = 0, insertions = 0, deletions = 0): DiffResultTextFile {
         return {
            file,
            changes,
            insertions,
            deletions,
            binary: false,
         };
      }

      function out(file: DiffResultTextFile, changed = 0, insertions = 0, deletions = 0) {
         return {
            diff: {
               changed,
               deletions,
               insertions,
               files: [file],
            },
         };
      }

      it('should read one line for each commit when using shortstat', async () => {
         const options = ['--shortstat'];
         const actual = await newSimpleGit(context.root).log(options);

         expect(actual.all).toHaveLength(2);
      });

      it('should work using numstat', async () => {
         const options = ['--numstat'];
         const actual = await newSimpleGit(context.root).log(options);
         expect(actual).toEqual(
            like({
               all: [like(out(file(b, 1, 1), 1, 1)), like(out(file(a, 1, 1), 1, 1))],
            })
         );
      });

      it('should work name only (summary has count of file changes, files show no count data)', async () => {
         const options = ['--name-only'];
         const actual = await newSimpleGit(context.root).log(options);
         expect(actual).toEqual(
            like({
               all: [like(out(file(b, 0), 1)), like(out(file(a, 0), 1))],
            })
         );
      });

      it('should fail when using multiple summary types', async () => {
         const result = await promiseResult(
            newSimpleGit(context.root).log(['--stat', '--numstat'])
         );

         expect(result.threw).toBe(true);
      });
   });
});
