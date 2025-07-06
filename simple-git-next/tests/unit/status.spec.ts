import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithError,
   closeWithSuccess,
   like,
   newSimpleGit,
   stagedDeleted,
   stagedIgnored,
   stagedModified,
   stagedRenamed,
   stagedRenamedWithModifications,
   statusResponse,
   unStagedDeleted,
} from './__fixtures__';
import { SimpleGit, StatusResult } from '../../typings';
import { parseStatusSummary, StatusSummary } from '../../src/lib/responses/StatusSummary';
import { NULL } from '../../src/lib/utils';

describe('status', () => {
   let git: SimpleGit;
   let callback: jest.Mock;
   let statusCommands = (...extras: string[]) => [
      'status',
      '--porcelain',
      '-b',
      '-u',
      '--null',
      ...extras,
   ];

   beforeEach(() => (callback = jest.fn()));

   describe('usage', () => {
      beforeEach(() => (git = newSimpleGit()));

      it('ignores explicit --null option', async () => {
         git.status(['-a', '--null', '-b', '-z', '-c']);
         await closeWithSuccess();

         assertExecutedCommands(...statusCommands('-a', '-b', '-c'));
      });

      it('throws errors to the rejection handler', async () => {
         const queue = git.status();
         await closeWithError('unknown');

         assertFailure(await promiseError(queue), 'unknown', statusCommands());
      });

      it('Awaiting no arguments', async () => {
         const summary = git.status();
         await closeWithSuccess();

         assertSuccess(await summary, statusCommands());
      });

      it('Awaiting array options', async () => {
         const summary = git.status(['--', 'pathspec']);
         await closeWithSuccess();

         assertSuccess(await summary, statusCommands('--', 'pathspec'));
      });

      it('Awaiting object options', async () => {
         const summary = git.status({ '--some': 'value' });
         await closeWithSuccess();

         assertSuccess(await summary, statusCommands('--some=value'));
      });

      it('Callback with no options', async () => {
         const queue = git.status(callback);
         await closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands(...statusCommands());
      });

      it('Callback with array options', async () => {
         const queue = git.status(['--', 'pathspec'], callback);
         await closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands(...statusCommands('--', 'pathspec'));
      });

      it('Callback with object options', async () => {
         const queue = git.status({ '--arg': 'value' }, callback);
         await closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands(...statusCommands('--arg=value'));
      });

      it('throws errors to the callback', async () => {
         const queue = git.status(callback);
         await closeWithError('unknown');

         expect(callback).toBeCalledWith(await promiseError(queue), undefined);
         assertExecutedCommands(...statusCommands());
      });
   });

   describe('parsing', () => {
      const empty = {
         created: [],
         modified: [],
         deleted: [],
         staged: [],
      };

      it('Ignores unknown modifiers', () => {
         expect(parseStatusSummary('$@ UNKNOWN')).toEqual(
            like({
               ...empty,
               files: [
                  {
                     index: '$',
                     working_dir: '@',
                     path: 'UNKNOWN',
                  },
               ],
            })
         );
      });

      it('Handles files with non ascii names', () => {
         expect(
            parseStatusSummary(statusResponse('main', stagedModified('😀 file.ext')).stdOut)
         ).toEqual(
            like({
               current: 'main',
               modified: ['😀 file.ext'],
            })
         );
      });

      it('Handles files with spaces in their names', () => {
         expect(
            parseStatusSummary(statusResponse('main', stagedModified('foo bar.ext')).stdOut)
         ).toEqual(
            like({
               current: 'main',
               modified: ['foo bar.ext'],
            })
         );
      });

      it('Handles ignored files', () => {
         expect(parseStatusSummary(statusResponse('main', stagedIgnored).stdOut)).toEqual(
            like({
               ...empty,
               ignored: ['ignored.ext'],
               files: [],
            })
         );
      });

      it('Handles malformatted rename', () => {
         expect(parseStatusSummary(statusResponse('main', 'R  file.ext').stdOut)).toEqual(
            like({
               ...empty,
               current: 'main',
               renamed: [{ from: 'file.ext', to: 'file.ext' }],
            })
         );
      });

      it('Handles staged rename', () => {
         expect(parseStatusSummary(statusResponse('main', stagedRenamed).stdOut)).toEqual(
            like({
               ...empty,
               current: 'main',
               renamed: [{ from: 'from.ext', to: 'to.ext' }],
            })
         );
      });

      it('Handles staged rename with un-staged modifications', () => {
         expect(
            parseStatusSummary(statusResponse('main', stagedRenamedWithModifications).stdOut)
         ).toEqual(
            like({
               ...empty,
               current: 'main',
               renamed: [{ from: 'from.ext', to: 'to.ext' }],
               modified: ['to.ext'],
            })
         );
      });

      it('Handles staged modified', () => {
         expect(parseStatusSummary(statusResponse('main', stagedModified).stdOut)).toEqual(
            like({
               current: 'main',
               modified: ['staged-modified.ext'],
            })
         );
      });

      it('Handles (un)staged deleted', () => {
         expect(
            parseStatusSummary(statusResponse('main', stagedDeleted, unStagedDeleted).stdOut)
         ).toEqual(
            like({
               current: 'main',
               created: [],
               modified: [],
               deleted: ['staged-deleted.ext', 'un-staged-deleted.ext'],
               staged: ['staged-deleted.ext'],
            })
         );
      });

      it('Initial repo with no commits', () => {
         const statusSummary = parseStatusSummary(`## No commits yet on master`);

         expect(statusSummary).toEqual(
            like({
               current: `master`,
            })
         );
      });

      it('Complex status - renamed, new and un-tracked modifications', () => {
         const statusSummary = parseStatusSummary(
            statusResponse(
               'master',
               ' M other.txt',
               'A  src/b.txt',
               stagedRenamed('src/a.txt', 'src/c.txt')
            ).stdOut
         );

         expect(statusSummary).toEqual(
            like({
               created: ['src/b.txt'],
               modified: ['other.txt'],
               renamed: [{ from: 'src/a.txt', to: 'src/c.txt' }],
            })
         );
      });

      it('Handles renamed', () => {
         expect(parseStatusSummary(` R  src/another-file.js${NULL}src/file.js`)).toEqual(
            like({
               renamed: [{ from: 'src/file.js', to: 'src/another-file.js' }],
            })
         );
      });

      it('parses status - current, tracking and ahead', () => {
         expect(parseStatusSummary('## master...origin/master [ahead 3]')).toEqual(
            like({
               current: 'master',
               tracking: 'origin/master',
               ahead: 3,
               behind: 0,
            })
         );
      });

      it('parses status - current, tracking and behind', () => {
         expect(parseStatusSummary('## master...origin/master [behind 2]')).toEqual(
            like({
               detached: false,
               current: 'master',
               tracking: 'origin/master',
               ahead: 0,
               behind: 2,
            })
         );
      });

      it('parses status - current, tracking', () => {
         expect(parseStatusSummary('## release/0.34.0...origin/release/0.34.0')).toEqual(
            like({
               current: 'release/0.34.0',
               tracking: 'origin/release/0.34.0',
               ahead: 0,
               behind: 0,
            })
         );
      });

      it('parses status - HEAD no branch', () => {
         expect(parseStatusSummary('## HEAD (no branch)')).toEqual(
            like({
               detached: true,
               current: 'HEAD',
               tracking: null,
               ahead: 0,
               behind: 0,
            })
         );
      });

      it.each<[string, any]>([
         ['?? Not tracked File', { not_added: ['Not tracked File'] }],
         ['UU Conflicted', { conflicted: ['Conflicted'] }],
         [' D Removed', { deleted: ['Removed'] }],
         [' M Modified', { modified: ['Modified'] }],
         [' A Added', { created: ['Added'] }],
         ['AM Changed', { created: ['Changed'], modified: ['Changed'] }],
      ])('parses file status - %s', (file, result) => {
         expect(parseStatusSummary(statusResponse('branch', file).stdOut)).toEqual(
            like({
               modified: [],
               created: [],
               not_added: [],
               conflicted: [],
               deleted: [],
               ...result,
            })
         );
      });

      it('parses status', () => {
         expect(parseStatusSummary(statusResponse('this_branch').stdOut)).toEqual(
            like({
               current: 'this_branch',
               tracking: null,
            })
         );
      });

      it.each(['M', 'AM', 'UU', 'D'])('reports not clean branch containing %s', (type) => {
         expect(parseStatusSummary(`${type} file-name.foo`).isClean()).toBe(false);
      });

      it('allows isClean to be destructured', () => {
         const { isClean } = parseStatusSummary('\n');
         expect(isClean()).toBe(true);
      });

      it('reports empty response as a clean branch', () => {
         const statusSummary = parseStatusSummary('\n');

         expect(statusSummary.isClean()).toBe(true);
         expect(statusSummary).toEqual(
            like({
               created: [],
               deleted: [],
               modified: [],
               not_added: [],
               conflicted: [],
            })
         );
      });

      it('staged modified files identified separately to other modified files', () => {
         const statusSummary = parseStatusSummary(
            `## master${NULL} M aaa${NULL}M  bbb${NULL}A  ccc${NULL}?? ddd`
         );
         expect(statusSummary).toEqual(
            like({
               staged: ['bbb', 'ccc'],
               modified: ['aaa', 'bbb'],
            })
         );
      });

      it('staged modified file with modifications after staging', () => {
         const statusSummary = parseStatusSummary(
            `## master${NULL}MM staged-modified${NULL} M modified${NULL}M  staged`
         );
         expect(statusSummary).toEqual(
            like({
               staged: ['staged-modified', 'staged'],
               modified: ['staged-modified', 'modified', 'staged'],
            })
         );
      });

      it('modified status', () => {
         const statusSummary = parseStatusSummary(
            ` M package.json${NULL}M  src/git.js${NULL}AM src/index.js${NULL} A src/newfile.js${NULL}?? test${NULL}UU test.js`
         );

         expect(statusSummary).toEqual(
            like({
               created: ['src/index.js', 'src/newfile.js'],
               deleted: [],
               modified: ['package.json', 'src/git.js', 'src/index.js'],
               not_added: ['test'],
               conflicted: ['test.js'],
               staged: ['src/git.js', 'src/index.js'],
            })
         );
      });

      it('index/wd status', () => {
         const statusSummary = parseStatusSummary(
            statusResponse('main', ` M src/git_wd.js`, `MM src/git_ind_wd.js`, `M  src/git_ind.js`)
               .stdOut
         );
         expect(statusSummary).toEqual(
            like({
               files: [
                  { path: 'src/git_wd.js', index: ' ', working_dir: 'M' },
                  { path: 'src/git_ind_wd.js', index: 'M', working_dir: 'M' },
                  { path: 'src/git_ind.js', index: 'M', working_dir: ' ' },
               ],
            })
         );
      });

      it('Report conflict when both sides have added the same file', () => {
         expect(parseStatusSummary(statusResponse(`master`, `AA filename`).stdOut)).toEqual(
            like({
               conflicted: ['filename'],
            })
         );
      });

      it('Report all types of merge conflict statuses', () => {
         const statusSummary = parseStatusSummary(
            statusResponse(
               'branch',
               'UU package.json',
               'DD src/git.js',
               'DU src/index.js',
               'UD src/newfile.js',
               'AU test.js',
               'UA test',
               'AA test-foo.js'
            ).stdOut
         );

         expect(statusSummary).toEqual(
            like({
               conflicted: [
                  'package.json',
                  'src/git.js',
                  'src/index.js',
                  'src/newfile.js',
                  'test.js',
                  'test',
                  'test-foo.js',
               ],
            })
         );
      });
   });

   function assertSuccess(summary: StatusResult | unknown, commands: string[]) {
      expect(summary).toBeInstanceOf(StatusSummary);
      assertExecutedCommands(...commands);

      return summary;
   }

   function assertFailure(err: Error | unknown, message: string, commands: string[]) {
      assertGitError(err, message);
      assertExecutedCommands(...commands);

      return err;
   }
});
