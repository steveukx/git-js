import {
   createTestContext,
   like,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext
} from '../__fixtures__';

describe('diff', function () {
   const nameWithTrailingSpaces = 'name-with-trailing-spaces  ';
   const fileContent = Array(10).fill('Some content on this line\n').join('');
   const nextContent = Array(5).fill('Some content on this line\nDifferent on this line\n').join('');

   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
      await setUpFilesAdded(context, [nameWithTrailingSpaces], '.', fileContent);
      await context.file(nameWithTrailingSpaces, nextContent);
   });

   it('detects diff with --numstat', async () => {
      const diff = await newSimpleGit(context.root).diffSummary(['--numstat']);

      expect(diff).toEqual(like({
         changed: 1,
         deletions: 1,
         insertions: 10,
         files: [
            {
               file: nameWithTrailingSpaces,
               changes: 11,
               insertions: 10,
               deletions: 1,
               binary: false,
            }
         ]
      }));
   });


});
