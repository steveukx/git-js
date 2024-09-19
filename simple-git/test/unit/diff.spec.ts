import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   diffSummaryMultiFile,
   diffSummarySingleFile,
   like,
   newSimpleGit,
   wait,
} from './__fixtures__';
import { SimpleGit, TaskConfigurationError } from '../..';
import { LogFormat } from '../../src/lib/args/log-format';
import { getDiffParser } from '../../src/lib/parsers/parse-diff-summary';

describe('diff', () => {
   let git: SimpleGit;

   describe('parsing', () => {
      it('bin summary', () => {
         const summary = getDiffParser(LogFormat.STAT)(`
 my-package.tar.gz | Bin 3163 -> 3244 bytes
 1 file changed, 0 insertions(+), 0 deletions(-)
 `);
         expect(summary).toEqual(
            like({
               insertions: 0,
               deletions: 0,
               files: [
                  {
                     file: 'my-package.tar.gz',
                     before: 3163,
                     after: 3244,
                     binary: true,
                  },
               ],
            })
         );
      });

      it('single text file with changes', () => {
         const actual = getDiffParser(LogFormat.STAT)(
            diffSummarySingleFile(1, 2, 'package.json').stdOut
         );
         expect(actual).toEqual(
            like({
               changed: 1,
               insertions: 1,
               deletions: 2,
               files: [
                  {
                     file: 'package.json',
                     changes: 3,
                     insertions: 1,
                     deletions: 2,
                     binary: false,
                  },
               ],
            })
         );
      });

      it('multiple text files', () => {
         const actual = getDiffParser(LogFormat.STAT)(
            diffSummaryMultiFile(
               { fileName: 'src/git.js', insertions: 2 },
               { fileName: 'test/testCommands.js', deletions: 2, insertions: 1 }
            ).stdOut
         );

         expect(actual).toEqual(
            like({
               changed: 2,
               insertions: 3,
               deletions: 2,
               files: [
                  {
                     file: 'src/git.js',
                     changes: 2,
                     insertions: 2,
                     deletions: 0,
                     binary: false,
                  },
                  {
                     file: 'test/testCommands.js',
                     changes: 3,
                     insertions: 1,
                     deletions: 2,
                     binary: false,
                  },
               ],
            })
         );
      });

      it('recognises binary files', () => {
         const actual = getDiffParser(LogFormat.STAT)(`
            some/image.png     |       Bin 0 -> 9806 bytes
            1 file changed, 1 insertion(+)
         `);

         expect(actual).toEqual(
            like({
               files: [
                  {
                     file: 'some/image.png',
                     before: 0,
                     after: 9806,
                     binary: true,
                  },
               ],
            })
         );
      });

      it('recognises files changed in modified time only', () => {
         const actual = getDiffParser(LogFormat.STAT)(`
      abc | 0
      def | 1 +
      2 files changed, 1 insertion(+)
   `);

         expect(actual).toEqual(
            like({
               files: [
                  { file: 'abc', changes: 0, insertions: 0, deletions: 0, binary: false },
                  { file: 'def', changes: 1, insertions: 1, deletions: 0, binary: false },
               ],
            })
         );
      });

      it('picks number of files changed from summary line', () => {
         expect(getDiffParser(LogFormat.STAT)('1 file changed, 1 insertion(+)')).toHaveProperty(
            'changed',
            1
         );
         expect(
            getDiffParser(LogFormat.STAT)('2 files changed, 1 insertion(+), 1 deletion(+)')
         ).toHaveProperty('changed', 2);
      });
   });

   describe('usage', () => {
      beforeEach(() => (git = newSimpleGit()));

      it('diff - deprecated options', async () => {
         const queue = git.diff('foo' as any);
         const error = await promiseError(queue);

         assertGitError(
            error,
            'git.diff: supplying options as a single string is no longer supported',
            TaskConfigurationError
         );
      });

      it('diff - no options', async () => {
         const queue = git.diff();
         await closeWithSuccess('~~ data ~~');
         expect(await queue).toBe('~~ data ~~');
         assertExecutedCommands('diff');
      });

      it('diff - options array', async () => {
         const queue = git.diff(['FETCH', 'FETCH_HEAD']);
         await closeWithSuccess('~~ data ~~');
         expect(await queue).toBe('~~ data ~~');
         assertExecutedCommands('diff', 'FETCH', 'FETCH_HEAD');
      });

      it('diff - options object', async () => {
         const queue = git.diff({ a: null });
         await closeWithSuccess('~~ data ~~');
         expect(await queue).toBe('~~ data ~~');
         assertExecutedCommands('diff', 'a');
      });

      it('diff - options with callback', async () => {
         const later = jest.fn();
         git.diff({ a: null }, later);
         closeWithSuccess('~~ data ~~');
         await wait();

         expect(later).toHaveBeenCalledWith(null, '~~ data ~~');
      });

      it('trailing function handler receives result', async () => {
         const later = jest.fn();
         const queue = git.diffSummary(later);
         await closeWithSuccess(diffSummarySingleFile().stdOut);

         expect(later).toHaveBeenCalledWith(null, await queue);
      });

      it('diffSummary - no options', async () => {
         const queue = git.diffSummary();
         await closeWithSuccess(diffSummarySingleFile(1, 2, 'package.json').stdOut);

         expect(await queue).toEqual(
            like({
               changed: 1,
               insertions: 1,
               deletions: 2,
               files: [
                  {
                     file: 'package.json',
                     changes: 3,
                     insertions: 1,
                     deletions: 2,
                     binary: false,
                  },
               ],
            })
         );
         assertExecutedCommands('diff', '--stat=4096');
      });

      it('diffSummary - with options', async () => {
         git.diffSummary(['opt-a', 'opt-b'], jest.fn());
         await closeWithSuccess();
         assertExecutedCommands('diff', '--stat=4096', 'opt-a', 'opt-b');
      });

      it('diffSummary - with options object', async () => {
         git.diffSummary({ HEAD: null, FETCH_HEAD: null }, jest.fn());
         await closeWithSuccess();
         assertExecutedCommands('diff', '--stat=4096', 'HEAD', 'FETCH_HEAD');
      });

      it('diffSummary - single option', async () => {
         git.diffSummary('opt-a' as any, jest.fn());
         await closeWithSuccess(diffSummarySingleFile().stdOut);
         assertExecutedCommands('diff', '--stat=4096', 'opt-a');
      });
   });

   describe('log-format', () => {
      const file = 'simple-git/test/unit/diff.spec.ts';

      beforeEach(() => (git = newSimpleGit()));

      it('diffSummary with --numstat', async () => {
         const task = git.diffSummary(['--numstat']);
         await closeWithSuccess(`14\t0\t${file}\n`);

         assertExecutedCommands('diff', '--numstat');
         expect(await task).toEqual(
            like({
               changed: 1,
               deletions: 0,
               insertions: 14,
               files: [
                  {
                     file,
                     changes: 14,
                     insertions: 14,
                     deletions: 0,
                     binary: false,
                  },
               ],
            })
         );
      });

      it('diffSummary with custom --stat', async () => {
         const task = git.diffSummary(['--foo', '--stat', 'bar']);
         await closeWithSuccess(`
 ${file} | 14 ++++++++++++++
 1 file changed, 14 insertions(+)
`);

         assertExecutedCommands('diff', '--foo', '--stat', 'bar');
         expect(await task).toEqual(
            like({
               changed: 1,
               deletions: 0,
               insertions: 14,
               files: [
                  {
                     file,
                     changes: 14,
                     insertions: 14,
                     deletions: 0,
                     binary: false,
                  },
               ],
            })
         );
      });

      it('diffSummary with --name-only', async () => {
         const task = git.diffSummary(['--name-only']);
         await closeWithSuccess(file);

         assertExecutedCommands('diff', '--name-only');
         expect(await task).toEqual(
            like({
               changed: 1,
               deletions: 0,
               insertions: 0,
               files: [
                  {
                     file,
                     changes: 0,
                     insertions: 0,
                     deletions: 0,
                     binary: false,
                  },
               ],
            })
         );
      });

      it('diffSummary with --name-status', async () => {
         const task = git.diffSummary(['--name-status']);
         await closeWithSuccess(`M\t${file}\nR100\tfrom\tto`);

         assertExecutedCommands('diff', '--name-status');
         expect(await task).toEqual(
            like({
               changed: 2,
               deletions: 0,
               insertions: 0,
               files: [
                  {
                     file,
                     changes: 0,
                     insertions: 0,
                     deletions: 0,
                     binary: false,
                     similarity: 0,
                     status: 'M',
                     from: undefined,
                  },
                  {
                     file: 'to',
                     changes: 0,
                     insertions: 0,
                     deletions: 0,
                     binary: false,
                     similarity: 100,
                     status: 'R',
                     from: 'from',
                  },
               ],
            })
         );
      });

      it('disallows multiple output formats', async () => {
         const task = promiseError(git.diffSummary(['--stat', '--numstat']));
         assertGitError(await task, 'Summary flags are mutually exclusive');
      });

      it('disallows null terminators when using a summary format parser', async () => {
         const task = promiseError(git.diffSummary(['--name-only', '-z']));
         assertGitError(
            await task,
            'Summary flag --name-only parsing is not compatible with null termination'
         );
      });
   });
});
