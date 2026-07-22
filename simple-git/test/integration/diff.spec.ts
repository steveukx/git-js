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

describe('diff binary files', function () {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
   });

   it('detects renamed binary files', async () => {
      const git = newSimpleGit(context.root);
      const original = 'uploads/image.png';
      const renamed = 'uploads/image-test.png';

      await context.file(['uploads', 'image.png'], '\0binary image content');
      await git.add(original).commit('add binary file');
      const beforeRename = await git.revparse('HEAD');

      await git.mv(original, renamed).commit('rename binary file');
      const diff = await git.diffSummary([beforeRename, 'HEAD']);

      expect(diff.files).toEqual([
         {
            file: 'uploads/{image.png => image-test.png}',
            before: 0,
            after: 0,
            binary: true,
         },
      ]);
   });
});
