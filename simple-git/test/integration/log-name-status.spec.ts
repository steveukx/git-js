import {
   createTestContext,
   like,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { DiffNameStatus, DiffResultTextFile } from '../..';

describe('log-name-status', function () {
   let context: SimpleGitTestContext;
   const steps = ['mv a b', 'commit -m two'];

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
      await setUpFilesAdded(context, ['a'], '.', 'one');
      for (const step of steps) {
         await context.git.raw(step.split(' '));
      }
   });

   it('detects files moved with --name-status', async () => {
      const actual = await newSimpleGit(context.root).log(['--name-status']);

      expect(actual.all).toEqual([
         mockListLogLine('two', { b: DiffNameStatus.RENAMED }),
         mockListLogLine('one', { a: DiffNameStatus.ADDED }),
      ]);
   });
});

function mockListLogLine(message: string, changes: Record<string, DiffNameStatus>) {
   const files: DiffResultTextFile[] = Object.entries(changes).map(([file, status]) => {
      return {
         binary: false,
         changes: 0,
         deletions: 0,
         file,
         insertions: 0,
         status,
      };
   });
   return like({
      message,
      diff: like({ changed: files.length, deletions: 0, insertions: 0, files }),
   });
}
