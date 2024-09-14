import {
   createTestContext,
   like,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('diff', function () {
   const nameWithTrailingSpaces = 'name-with-trailing-spaces  ';
   const fileContent = Array(10).fill('Some content on this line\n').join('');
   const nextContent = Array(5)
      .fill('Some content on this line\nDifferent on this line\n')
      .join('');

   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
      await setUpFilesAdded(context, [nameWithTrailingSpaces], '.', fileContent);
      await context.file(nameWithTrailingSpaces, nextContent);
   });

   it('detects moved files with --namestatus', async () => {
      // save current repo state, move a file, commit that move, get the commit hash of the previous commit
      const log = await newSimpleGit(context.root)
         .add('.')
         .commit('change content')
         .mv(nameWithTrailingSpaces, 'next.file')
         .add('.')
         .commit('renaming')
         .log();

      const diffC = await newSimpleGit(context.root).diffSummary([
         log.all[1].hash,
         '--name-status',
      ]);

      expect(diffC.files).toEqual([
         like({
            file: 'next.file',
            from: nameWithTrailingSpaces,
         }),
      ]);
   });

   it('detects diff with --numstat', async () => {
      const diff = await newSimpleGit(context.root).diffSummary(['--numstat']);

      expect(diff).toEqual(
         like({
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
               },
            ],
         })
      );
   });
});
