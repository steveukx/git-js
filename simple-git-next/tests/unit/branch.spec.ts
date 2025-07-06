import { BranchSingleDeleteResult, BranchSummary, SimpleGit } from 'typings';
import {
   assertExecutedCommands,
   branchSummary,
   branchSummaryLine,
   closeWithSuccess,
   like,
   newSimpleGit,
} from './__fixtures__';

import { parseBranchSummary } from '../../src/lib/parsers/parse-branch';
import { BranchSummaryResult } from '../../src/lib/responses/BranchSummary';

describe('branch', () => {
   let callback: jest.Mock;
   let git: SimpleGit;
   let promise: Promise<BranchSummary | BranchSingleDeleteResult>;

   function branchDeleteLog(branchName: string, hash = 'b190102') {
      return `Deleted branch ${branchName} (was ${hash}).`;
   }

   function branchDeleteNotFound(branchName: string) {
      return `error: branch '${branchName}' not found.`;
   }

   function branchDetailLine(
      name = 'master',
      hash = 'abcdef',
      label = 'Branch Label',
      current = false
   ) {
      return `${current ? '*' : ' '} ${name}     ${hash} ${label}`;
   }

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('handles verbosity being set by the user', async () => {
      git.branch(['--list', '--remote', '-v']);
      await closeWithSuccess();

      assertExecutedCommands('branch', '--list', '--remote', '-v');
   });

   it('handles verbosity not being set by the user', async () => {
      git.branch(['--list', '--remote']);
      await closeWithSuccess();

      assertExecutedCommands('branch', '-v', '--list', '--remote');
   });

   describe('deleting branches', () => {
      const branchName = 'new-branch';

      function assertBranchDeletion(
         options: string[],
         branchSummary: BranchSummary | BranchSingleDeleteResult,
         hash: string | null = 'b190102',
         branch = branchName
      ) {
         assertExecutedCommands('branch', '-v', ...options);
         expect(branchSummary).toEqual({
            branch,
            hash,
            success: hash !== null,
         });
      }

      it('delete local branch with -d option', async () => {
         const options = ['-d', branchName];
         const result = git.branch(options, callback);
         await closeWithSuccess(branchDeleteLog(branchName));

         assertBranchDeletion(options, await result);
      });

      it('delete local branch with -D option', async () => {
         const options = ['-D', branchName];
         const result = git.branch(options, callback);
         await closeWithSuccess(branchDeleteLog(branchName));

         assertBranchDeletion(options, await result);
      });

      it('delete local branch with --delete option', async () => {
         const options = ['--delete', branchName];
         const result = git.branch(options, callback);
         await closeWithSuccess(branchDeleteLog(branchName));

         assertBranchDeletion(options, await result);
      });

      it('deleteLocalBranch success', async () => {
         const options = ['-d', branchName];
         promise = git.deleteLocalBranch(branchName);
         await closeWithSuccess(branchDeleteLog(branchName));

         assertBranchDeletion(options, await promise);
      });

      it('deleteLocalBranch errors', async () => {
         promise = git.deleteLocalBranch(branchName, callback);
         await closeWithSuccess(branchDeleteNotFound(branchName));

         assertBranchDeletion(['-d', branchName], await promise, null);
      });
   });

   describe('parsing', () => {
      it('handles branches with carriage returns in the commit message', async () => {
         expect(
            parseBranchSummary(
               branchSummary(
                  branchSummaryLine('Something', '012de2', false),
                  branchSummaryLine('Add support for carriage \r returns', '012de3', true),
                  branchSummaryLine('Something else', '012de4', false)
               )
            )
         ).toEqual(
            like({
               branches: {
                  'branch-012de2': {
                     commit: '012de2',
                     current: false,
                     label: 'Something',
                     name: 'branch-012de2',
                     linkedWorkTree: false,
                  },
                  'branch-012de3': {
                     commit: '012de3',
                     current: true,
                     label: 'Add support for carriage \r returns',
                     name: 'branch-012de3',
                     linkedWorkTree: false,
                  },
                  'branch-012de4': {
                     commit: '012de4',
                     current: false,
                     label: 'Something else',
                     name: 'branch-012de4',
                     linkedWorkTree: false,
                  },
               },
            })
         );
      });

      it('branch detail by name', async () => {
         const actual = parseBranchSummary(`
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
* drschwabe-add-branches             063069b Merge branch 'add-branches' of https://github.com/user/repo into drschwabe-add-branches
  master                             cb4be06 Release 1.30.0
         `);
         expect(actual).toEqual(
            like({
               current: 'drschwabe-add-branches',
               detached: false,
               all: ['cflynn07-add-git-ignore', 'drschwabe-add-branches', 'master'],
               branches: {
                  'cflynn07-add-git-ignore': {
                     commit: 'a0b67a3',
                     current: false,
                     label: 'Add support for filenames containing spaces',
                     name: 'cflynn07-add-git-ignore',
                     linkedWorkTree: false,
                  },
                  'drschwabe-add-branches': {
                     commit: '063069b',
                     current: true,
                     label: `Merge branch 'add-branches' of https://github.com/user/repo into drschwabe-add-branches`,
                     name: 'drschwabe-add-branches',
                     linkedWorkTree: false,
                  },
                  'master': {
                     commit: 'cb4be06',
                     current: false,
                     label: 'Release 1.30.0',
                     name: 'master',
                     linkedWorkTree: false,
                  },
               },
            })
         );
      });

      it('detached branches', async () => {
         const actual = parseBranchSummary(`
* (detached from 1.6.0)              2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
         `);
         expect(actual).toEqual(
            like({
               current: '1.6.0',
               detached: true,
               all: ['1.6.0', 'cflynn07-add-git-ignore', 'master'],
            })
         );
      });

      it('detached head at branch', async () => {
         const actual = parseBranchSummary(`
* (HEAD detached at origin/master)   2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
         `);
         expect(actual).toEqual(
            like({
               current: 'origin/master',
               detached: true,
               all: ['origin/master', 'cflynn07-add-git-ignore', 'master'],
            })
         );
      });

      it('detached head at commit', async () => {
         const actual = parseBranchSummary(`
* (HEAD detached at 2b2dba2)         2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
         `);
         expect(actual).toEqual(
            like({
               current: '2b2dba2',
               detached: true,
               all: ['2b2dba2', 'cflynn07-add-git-ignore', 'master'],
            })
         );
      });

      it(`branches in linked work trees`, () => {
         const actual = parseBranchSummary(`
  main 3c43b1d first
* x    e94b8dd second
+ y    3c43b1d first
         `);

         expect(actual).toEqual(
            like({
               current: 'x',
               all: ['main', 'x', 'y'],
               branches: {
                  main: {
                     commit: '3c43b1d',
                     current: false,
                     label: 'first',
                     linkedWorkTree: false,
                     name: 'main',
                  },
                  x: {
                     commit: 'e94b8dd',
                     current: true,
                     label: 'second',
                     linkedWorkTree: false,
                     name: 'x',
                  },
                  y: {
                     commit: '3c43b1d',
                     current: false,
                     label: 'first',
                     linkedWorkTree: true,
                     name: 'y',
                  },
               },
            })
         );
      });

      it('branches without labels', async () => {
         const actual = parseBranchSummary(`
* stable                f8cc2bc
  remotes/origin/stable f8cc2bd
  dev                   f8cc2be wip
         `);
         expect(actual).toEqual(
            like({
               current: 'stable',
               all: ['stable', 'remotes/origin/stable', 'dev'],
               branches: {
                  'stable': {
                     commit: 'f8cc2bc',
                     current: true,
                     label: '',
                     name: 'stable',
                     linkedWorkTree: false,
                  },
                  'remotes/origin/stable': {
                     commit: 'f8cc2bd',
                     current: false,
                     label: '',
                     name: 'remotes/origin/stable',
                     linkedWorkTree: false,
                  },
                  'dev': {
                     commit: 'f8cc2be',
                     current: false,
                     label: 'wip',
                     name: 'dev',
                     linkedWorkTree: false,
                  },
               },
            })
         );
      });
   });

   describe('usage', () => {
      describe('branch', () => {
         it('with options array and callback', async () => {
            promise = git.branch(['-v', '--sort=-committerdate'], callback);
            await closeWithSuccess();

            assertExecutedCommands('branch', '-v', '--sort=-committerdate');
            expect(callback).toHaveBeenCalledWith(null, await promise);
         });

         it('with options array as promise', async () => {
            promise = git.branch(['-v', '--sort=-committerdate']);
            await closeWithSuccess();

            assertExecutedCommands('branch', '-v', '--sort=-committerdate');
            expect(await promise).toBeInstanceOf(BranchSummaryResult);
         });

         it('with options object and callback', async () => {
            promise = git.branch({ '-v': null, '--sort': '-committerdate' }, callback);
            await closeWithSuccess();

            assertExecutedCommands('branch', '-v', '--sort=-committerdate');
            expect(callback).toHaveBeenCalledWith(null, await promise);
         });

         it('with options object as promise', async () => {
            promise = git.branch({ '-v': null, '--sort': '-committerdate' });
            await closeWithSuccess();

            assertExecutedCommands('branch', '-v', '--sort=-committerdate');
            expect(await promise).toBeInstanceOf(BranchSummaryResult);
         });
      });

      describe('branchLocal', () => {
         it('with callback', async () => {
            promise = git.branchLocal(callback);
            await closeWithSuccess(branchDetailLine('master', '899725c'));

            assertExecutedCommands('branch', '-v');
            expect(callback).toHaveBeenCalledWith(null, await promise);
         });

         it('as promise', async () => {
            promise = git.branchLocal();
            await closeWithSuccess(branchDetailLine('master', '899725c'));

            assertExecutedCommands('branch', '-v');
            expect(await promise).toBeInstanceOf(BranchSummaryResult);
         });
      });

      describe('deleteLocalBranch', () => {
         const branch = 'some-branch',
            hash = 'abcdef';
         const deleteLocalSuccess = () => closeWithSuccess(branchDeleteLog(branch, hash));

         it('with callback', async () => {
            promise = git.deleteLocalBranch(branch, callback);
            await deleteLocalSuccess();

            assertExecutedCommands('branch', '-v', '-d', branch);
            expect(callback).toHaveBeenCalledWith(null, await promise);
         });

         it('as promise', async () => {
            promise = git.deleteLocalBranch(branch);
            await deleteLocalSuccess();

            assertExecutedCommands('branch', '-v', '-d', branch);
            expect(await promise).toEqual({ branch, hash, success: true });
         });

         it('as force with callback', async () => {
            promise = git.deleteLocalBranch(branch, true, callback);
            await deleteLocalSuccess();

            assertExecutedCommands('branch', '-v', '-D', branch);
            expect(callback).toHaveBeenCalledWith(null, await promise);
         });

         it('as force promise', async () => {
            promise = git.deleteLocalBranch(branch, true);
            await deleteLocalSuccess();

            assertExecutedCommands('branch', '-v', '-D', branch);
            expect(await promise).toEqual({ branch, hash, success: true });
         });

         it('as not-force with callback', async () => {
            promise = git.deleteLocalBranch(branch, false, callback);
            await deleteLocalSuccess();

            assertExecutedCommands('branch', '-v', '-d', branch);
            expect(callback).toHaveBeenCalledWith(null, await promise);
         });
      });
   });
});
