import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   like,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { CleanOptions } from '../../src/lib/tasks/clean';

describe('clean', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.file('.gitignore', 'ignored.*\n');
      await setUpFilesAdded(
         context,
         ['ignored.one', 'ignored.two', 'tracked.bbb', 'un-tracked.ccc'],
         ['*.bbb', '.gitignore']
      );
   });

   it('rejects on bad configuration', async () => {
      const git = newSimpleGit(context.root);
      assertGitError(
         await promiseError(git.clean(CleanOptions.DRY_RUN, ['--interactive'])),
         /interactive mode/i
      );
   });

   it('removes ignored files', async () => {
      const git = newSimpleGit(context.root);
      expect(await git.clean(CleanOptions.FORCE + CleanOptions.IGNORED_ONLY)).toEqual(
         like({
            dryRun: false,
            files: ['ignored.one', 'ignored.two'],
         })
      );
   });

   it('removes un-tracked and ignored files', async () => {
      const git = newSimpleGit(context.root);
      expect(await git.clean([CleanOptions.DRY_RUN, CleanOptions.IGNORED_INCLUDED])).toEqual(
         like({
            dryRun: true,
            files: ['ignored.one', 'ignored.two', 'un-tracked.ccc'],
         })
      );
   });

   it('handles a CleanOptions array with regular options array', async () => {
      await context.dir('one');
      await context.dir('two');
      await context.files(['one', 'abc'], ['one', 'def'], ['two', 'abc'], ['two', 'def']);

      const git = newSimpleGit(context.root);

      expect(await git.clean([CleanOptions.DRY_RUN])).toEqual(
         like({
            files: ['un-tracked.ccc'],
            folders: [],
         })
      );

      expect(await git.clean([CleanOptions.DRY_RUN], ['-d'])).toEqual(
         like({
            files: ['un-tracked.ccc'],
            folders: ['one/', 'two/'],
         })
      );
   });
});
