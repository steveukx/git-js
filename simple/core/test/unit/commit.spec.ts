import { promiseError } from '@kwsites/promise-result';

import { type SimpleGitCore, TaskConfigurationError } from '../..';
import { parseCommitResult } from '../../src/parsers/parse-commit';
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
} from '../__fixtures__';

describe('commit', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   describe('usage', () => {
      it('empty commit', async () => {
         git.commit([], { '--amend': null, '--no-edit': null });
         await closeWithSuccess();
         assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '--amend', '--no-edit');
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
