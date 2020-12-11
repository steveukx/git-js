import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithError,
   closeWithSuccess,
   like,
   newSimpleGit,
   newSimpleGitP,
   stagedDeleted,
   stagedModified,
   stagedRenamed,
   stagedRenamedWithModifications,
   statusResponse,
   unStagedDeleted
} from './__fixtures__';
import { SimpleGit, StatusResult } from '../../typings';
import { parseStatusSummary, StatusSummary } from '../../src/lib/responses/StatusSummary';

describe('status', () => {
   let git: SimpleGit;
   let callback: jest.Mock;
   let statusCommands = (...extras: string[]) => ['status', '--porcelain', '-b', '-u', ...extras];

   beforeEach(() => callback = jest.fn());

   describe('(legacy) promise usage', () => {

      beforeEach(() => git = newSimpleGitP());

      it('gets the repo status with no options', async () => {
         const queue = git.status();
         await closeWithSuccess();

         assertSuccess(await queue, statusCommands());
      });

      it('gets the repo status with array options', async () => {
         const queue = git.status(['some', 'options']);
         await closeWithSuccess();

         assertSuccess(await queue, statusCommands('some', 'options'));
      });

      it('gets the repo status with object options', async () => {
         const queue = git.status({'--foo': 'bar'});
         await closeWithSuccess();

         assertSuccess(await queue, statusCommands('--foo=bar'));
      });

      it('throws errors to the rejection handler', async () => {
         const error = promiseError(git.status({'--foo': 'bar'}));
         await closeWithError('something');

         assertFailure(await error, 'something', statusCommands('--foo=bar'));
      });
   });

   describe('usage', () => {

      beforeEach(() => git = newSimpleGit());

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
         const summary = git.status({'--some': 'value'});
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
         const queue = git.status({'--arg': 'value'}, callback);
         await closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands(...statusCommands('--arg=value'));
      });

      it('throws errors to the callback', async () => {
         const queue = git.status(callback);
         await closeWithError('unknown');

         expect(callback).toBeCalledWith(await promiseError(queue));
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
         expect(parseStatusSummary('$@ UNKNOWN')).toEqual(like({
            ...empty,
            files: [
               {
                  index: '$',
                  working_dir: '@',
                  path: 'UNKNOWN',
               }
            ],
         }))
      })

      it('Handles malformatted rename', () => {
         expect(parseStatusSummary(statusResponse('main', 'R  file.ext').stdOut)).toEqual(like({
            ...empty,
            current: 'main',
            renamed: [{from: 'file.ext', to: 'file.ext'}],
         }));
      });

      it('Handles staged rename', () => {
         expect(parseStatusSummary(statusResponse('main', stagedRenamed).stdOut)).toEqual(like({
            ...empty,
            current: 'main',
            renamed: [{from: 'from.ext', to: 'to.ext'}],
         }));
      });

      it('Handles staged rename with un-staged modifications', () => {
         expect(parseStatusSummary(statusResponse('main', stagedRenamedWithModifications).stdOut)).toEqual(like({
            ...empty,
            current: 'main',
            renamed: [{from: 'from.ext', to: 'to.ext'}],
            modified: ['to.ext'],
         }));
      });

      it('Handles staged modified', () => {
         expect(parseStatusSummary(statusResponse('main', stagedModified).stdOut)).toEqual(like({
            current: 'main',
            modified: ['staged-modified.ext'],
         }))
      });

      it('Handles (un)staged deleted', () => {
         expect(parseStatusSummary(statusResponse('main', stagedDeleted, unStagedDeleted).stdOut)).toEqual(like({
            current: 'main',
            created: [],
            modified: [],
            deleted: ['staged-deleted.ext', 'un-staged-deleted.ext'],
            staged: ['staged-deleted.ext']
         }))
      });

      it('Initial repo with no commits', () => {
         const statusSummary = parseStatusSummary(`
## No commits yet on master
         `);

         expect(statusSummary).toEqual(expect.objectContaining({
            current: `master`
         }))
      });

      it('Complex status - renamed, new and un-tracked modifications', () => {
         const statusSummary = parseStatusSummary(`
## master
 M other.txt
A  src/b.txt
R  src/a.txt -> src/c.txt
`);

         expect(statusSummary).toEqual(expect.objectContaining({
            created: ['src/b.txt'],
            modified: ['other.txt'],
            renamed: [{from: 'src/a.txt', to: 'src/c.txt'}]
         }));
      });

      it('Handles renamed', () => {
         expect(parseStatusSummary(' R  src/file.js -> src/another-file.js')).toEqual(expect.objectContaining({
            renamed: [{from: 'src/file.js', to: 'src/another-file.js'}],
         }));
      });

      it('parses status - current, tracking and ahead', () => {
         expect(parseStatusSummary('## master...origin/master [ahead 3]')).toEqual(expect.objectContaining({
            current: 'master',
            tracking: 'origin/master',
            ahead: 3,
            behind: 0,
         }));
      });

      it('parses status - current, tracking and behind', () => {
         expect(parseStatusSummary('## master...origin/master [behind 2]')).toEqual(expect.objectContaining({
            current: 'master',
            tracking: 'origin/master',
            ahead: 0,
            behind: 2,
         }));
      });

      it('parses status - current, tracking', () => {
         expect(parseStatusSummary('## release/0.34.0...origin/release/0.34.0')).toEqual(expect.objectContaining({
            current: 'release/0.34.0',
            tracking: 'origin/release/0.34.0',
            ahead: 0,
            behind: 0,
         }));
      });

      it('parses status - HEAD no branch', () => {
         expect(parseStatusSummary('## HEAD (no branch)')).toEqual(expect.objectContaining({
            current: 'HEAD',
            tracking: null,
            ahead: 0,
            behind: 0,
         }));
      });

      it('parses status - with untracked', () => {
         expect(parseStatusSummary('?? Not tracked File\nUU Conflicted\n D Removed')).toEqual(expect.objectContaining({
            not_added: ['Not tracked File'],
            conflicted: ['Conflicted'],
            deleted: ['Removed'],
         }));
      });

      it('parses status - modified, added and added-changed', () => {
         expect(parseStatusSummary(' M Modified\n A Added\nAM Changed')).toEqual(expect.objectContaining({
            modified: ['Modified', 'Changed'],
            created: ['Added', 'Changed'],
         }));
      });

      it('parses status', () => {
         expect(parseStatusSummary(statusResponse('this_branch').stdOut)).toEqual(expect.objectContaining({
            current: 'this_branch',
            tracking: null,
         }));
      });

      it.each(['M', 'AM', 'UU', 'D'])('reports not clean branch containing %s', (type) => {
         expect(parseStatusSummary(`${type} file-name.foo`).isClean()).toBe(false);
      });

      it('reports empty response as a clean branch', () => {
         const statusSummary = parseStatusSummary('\n');

         expect(statusSummary.isClean()).toBe(true);
         expect(statusSummary).toEqual(expect.objectContaining({
            created: [],
            deleted: [],
            modified: [],
            not_added: [],
            conflicted: [],
         }));
      });

      it('staged modified files identified separately to other modified files', () => {
         const statusSummary = parseStatusSummary(`
            ## master
             M aaa
            M  bbb
            A  ccc
            ?? ddd
      `);
         expect(statusSummary).toEqual(expect.objectContaining({
            staged: ['bbb', 'ccc'],
            modified: ['aaa', 'bbb'],
         }));
      });

      it('staged modified file with modifications after staging', () => {
         const statusSummary = parseStatusSummary(`
            ## master
            MM staged-modified
             M modified
            M  staged
      `);
         expect(statusSummary).toEqual(expect.objectContaining({
            staged: ['staged-modified', 'staged'],
            modified: ['staged-modified', 'modified', 'staged'],
         }));
      });

      it('modified status', () => {
         const statusSummary = parseStatusSummary(`
             M package.json
            M  src/git.js
            AM src/index.js
             A src/newfile.js
            ?? test
            UU test.js
      `);

         expect(statusSummary).toEqual(like({
            created: ['src/index.js', 'src/newfile.js'],
            deleted: [],
            modified: ['package.json', 'src/git.js', 'src/index.js'],
            not_added: ['test'],
            conflicted: ['test.js'],
            staged: ['src/git.js', 'src/index.js'],
         }));
      });

      it('index/wd status', () => {
         const statusSummary = parseStatusSummary(` M src/git_wd.js
MM src/git_ind_wd.js
M  src/git_ind.js
`);
         expect(statusSummary).toEqual(expect.objectContaining({
            files: [
               {path: 'src/git_wd.js', index: ' ', working_dir: 'M'},
               {path: 'src/git_ind_wd.js', index: 'M', working_dir: 'M'},
               {path: 'src/git_ind.js', index: 'M', working_dir: ' '}
            ],
         }));
      });

      it('Report conflict when both sides have added the same file', () => {
         expect(parseStatusSummary(`## master\nAA filename`)).toEqual(expect.objectContaining({
            conflicted: ['filename'],
         }));
      });

      it('Report all types of merge conflict statuses', () => {
         const statusSummary = parseStatusSummary(`
            UU package.json
            DD src/git.js
            DU src/index.js
            UD src/newfile.js
            AU test.js
            UA test
            AA test-foo.js
      `);

         expect(statusSummary).toEqual(expect.objectContaining({
            conflicted: ['package.json', 'src/git.js', 'src/index.js', 'src/newfile.js', 'test.js', 'test', 'test-foo.js']
         }));
      });
   });

   function assertSuccess(summary: StatusResult | unknown, commands: string[]) {
      expect(summary).toBeInstanceOf(StatusSummary);
      assertExecutedCommands(...commands);

      return summary;
   }

   function assertFailure(err: Error | unknown, message: string, commands: string[]) {
      assertGitError(err, message)
      assertExecutedCommands(...commands);

      return err;
   }
});

