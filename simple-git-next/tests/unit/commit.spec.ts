import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   commitResultNoneStaged,
   commitResultSingleFile,
   commitToBranch,
   commitToRepoRoot,
   like,
   newSimpleGit,
} from './__fixtures__';
import { SimpleGit, TaskConfigurationError } from '../..';
import { parseCommitResult } from '../../src/lib/parsers/parse-commit';

describe('commit', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   describe('usage', () => {
      it('empty commit', async () => {
         git.commit([], { '--amend': null, '--no-edit': null });
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '--amend', '--no-edit');
      });

      it('single message, no files, no options and callback', async () => {
         const task = git.commit('message', callback);
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '-m', 'message');
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('multi message, no files, no options and callback', async () => {
         const task = git.commit(['aaa', 'bbb'], callback);
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '-m', 'aaa', '-m', 'bbb');
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('single message, no files, with options object and callback', async () => {
         const task = git.commit('message', { '--opt': null }, callback);
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '-m', 'message', '--opt');
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('single message, single file, options object and callback', async () => {
         const task = git.commit('msg', 'aaa.txt', { '--opt': null }, callback);
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '-m', 'msg', 'aaa.txt', '--opt');
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('single message, single file, no options with callback', async () => {
         const task = git.commit('msg', 'aaa.txt', callback);
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '-m', 'msg', 'aaa.txt');
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('multi message, single file, no options with callback', async () => {
         const task = git.commit(['aaa', 'bbb'], 'aaa.txt', callback);
         await closeWithSuccess();
         assertExecutedCommands(
            '-c',
            'core.abbrev=40',
            'commit',
            '-m',
            'aaa',
            '-m',
            'bbb',
            'aaa.txt'
         );
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('multi message, multi file, no options with callback', async () => {
         const task = git.commit(['aaa', 'bbb'], ['a.txt', 'b.txt'], callback);
         await closeWithSuccess();
         assertExecutedCommands(
            '-c',
            'core.abbrev=40',
            'commit',
            '-m',
            'aaa',
            '-m',
            'bbb',
            'a.txt',
            'b.txt'
         );
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('multi message, multi file, options object with callback', async () => {
         const task = git.commit(['aaa', 'bbb'], ['a.txt', 'b.txt'], { '--foo': null }, callback);
         await closeWithSuccess();
         assertExecutedCommands(
            '-c',
            'core.abbrev=40',
            'commit',
            '-m',
            'aaa',
            '-m',
            'bbb',
            'a.txt',
            'b.txt',
            '--foo'
         );
         expect(callback).toHaveBeenCalledWith(null, await task);
      });

      it('deprecated usage: empty message', async () => {
         assertGitError(
            await promiseError(git.commit(null as any)),
            'git.commit: requires the commit message to be supplied',
            TaskConfigurationError
         );
      });
   });

   describe('parsing', () => {
      it('handles no files staged', () => {
         expect(parseCommitResult(commitResultNoneStaged)).toEqual({
            author: null,
            branch: '',
            commit: '',
            root: false,
            summary: {
               changes: 0,
               insertions: 0,
               deletions: 0,
            },
         });
      });

      it('detects author', () => {
         expect(parseCommitResult(commitResultSingleFile)).toEqual(
            like({
               author: {
                  email: 'some@author.com',
                  name: 'Some Author',
               },
            })
         );
      });

      it('detects change summary with segments missing', () => {
         expect(parseCommitResult(` 1 files changed, 2 deletions(-) `)).toHaveProperty(
            'summary',
            like({
               changes: 1,
               insertions: 0,
               deletions: 2,
            })
         );
      });

      it('detects multi-file change summary', () => {
         expect(
            parseCommitResult(`3 files changed, 29 insertions(+), 12 deletions(-)`)
         ).toHaveProperty(
            'summary',
            like({
               changes: 3,
               insertions: 29,
               deletions: 12,
            })
         );
      });

      it('detects branch name and commit hash', () => {
         expect(
            parseCommitResult(`[branchNameInHere CommitHash] Add nodeunit test runner`)
         ).toEqual(
            like({
               branch: 'branchNameInHere',
               commit: 'CommitHash',
               root: false,
            })
         );
      });

      it('handles the root commit', () => {
         const actual = parseCommitResult(commitToRepoRoot({ hash: 'foo', message: 'bar' }));
         expect(actual).toEqual(
            like({
               branch: 'master',
               commit: 'foo',
               root: true,
            })
         );
      });

      it('handles files with square brackets', () => {
         const actual = parseCommitResult(
            commitToBranch({ fileName: '[AB] CDE FGH.txt', branch: 'alpha' })
         );
         expect(actual).toEqual(
            like({
               branch: 'alpha',
               root: false,
            })
         );
      });
   });
});
