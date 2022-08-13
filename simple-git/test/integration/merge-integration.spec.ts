import { GitResponseError, MergeResult, SimpleGit } from '../../typings';
import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createSingleConflict,
   createTestContext,
   FIRST_BRANCH,
   like,
   newSimpleGit,
   SECOND_BRANCH,
   setUpConflicted,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('merge', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.files('aaa.txt', 'bbb.txt', 'ccc.other');
      await setUpConflicted(context);
   });

   async function singleFileConflict(simpleGit: SimpleGit) {
      const branchName = await createSingleConflict(context);
      const mergeError = await promiseError<GitResponseError<MergeResult>>(
         simpleGit.merge([branchName])
      );

      expect(mergeError?.git.conflicts).toEqual([{ file: 'aaa.txt', reason: 'content' }]);
      assertGitError(mergeError, 'CONFLICTS: aaa.txt:content');
   }

   it('single file conflict: git', async () => {
      await singleFileConflict(newSimpleGit(context.root));
   });

   it('multiple files conflicted', async () => {
      const git = newSimpleGit(context.root);

      // second is ahead of master and has both file
      await git.checkout(SECOND_BRANCH);
      await context.file(`bbb.txt`, Array(19).join('bbb\n') + 'BBB\n');
      await git.add(`bbb.txt`);
      await git.commit('move second ahead of first');

      // switch to first and create conflicts with second
      await git.checkout(FIRST_BRANCH);
      await context.file(`aaa.txt`, 'Conflicting\nFile content');
      await context.file(`bbb.txt`, 'BBB\n' + Array(19).join('bbb\n'));
      await context.file(`ccc.txt`, 'Totally Conflicting');
      await git.add([`aaa.txt`, `bbb.txt`, `ccc.txt`]);
      await git.commit('move first ahead of second');

      // merging second will fail on `aaa.txt` and `ccc.txt` due to the same line changing
      // but `bbb.txt` will merge fine because they changed at opposing ends of the file
      const mergeError = await promiseError<GitResponseError<MergeResult>>(
         git.merge([SECOND_BRANCH])
      );

      expect(mergeError?.git).toHaveProperty('failed', true);
      expect(theConflicts(mergeError)).toEqual([
         { reason: 'add/add', file: 'ccc.txt' },
         {
            reason: 'content',
            file: 'aaa.txt',
         },
      ]);
   });

   it('multiple files updated and merged', async () => {
      const git = newSimpleGit(context.root);

      await git.checkout(FIRST_BRANCH);
      expect(await git.merge([SECOND_BRANCH])).toEqual(like({ failed: false }));
   });

   function theConflicts(mergeError?: GitResponseError<MergeResult>) {
      if (!mergeError?.git.conflicts) {
         throw new Error(`expectTheConflicts called on non-error response`);
      }

      return [...mergeError.git.conflicts].sort((a, b) => (a.reason > b.reason ? 1 : -1));
   }
});
