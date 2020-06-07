const {setUpConflicted, createSingleConflict, createTestContext} = require('../helpers');

describe('merge', () => {

   let context;

   beforeEach(() => context = createTestContext());
   beforeEach(() => setUpConflicted(context.gitP(context.root), context));

   async function singleFileConflict (simpleGit) {
      const branchName = await createSingleConflict(simpleGit, context);

      const mergeError = await simpleGit.merge([branchName]).catch(e => {
         if (e.git) {
            expect(e.message).toBe('CONFLICTS: aaa.txt:content');
            return e.git;
         }

         throw e;
      });

      expect(mergeError.conflicts).toEqual([{file: 'aaa.txt', reason: 'content'}]);
   }

   it('single file conflict: git', async () => {
      await singleFileConflict( context.git(context.root).silent(true) );
   });

   it('single file conflict: gitP', async () => {
      await singleFileConflict( context.gitP(context.root).silent(true) );
   });

   it('multiple files conflicted', async () => {
      const git = context.gitP(context.root).silent(true);

      await git.checkout('second');
      await context.fileP(`bbb.txt`, Array.from({length: 19}, () => 'bbb').join('\n') + '\nBBB');
      await git.add([`bbb.txt`]);
      await git.commit('move second ahead of first');       // second is ahead with both files

      await git.checkout('first');                          // moves back in both files
      await context.fileP(`aaa.txt`, 'Conflicting\nFile content');
      await context.fileP(`bbb.txt`, 'BBB\n' + Array.from({length: 19}, () => 'bbb').join('\n'));
      await context.fileP(`ccc.txt`, 'Totally Conflicting');
      await git.add([`aaa.txt`, `bbb.txt`, `ccc.txt`]);  // first ahead of second with conflicts on another
      await git.commit('move first ahead of second');       // "another-file" modified in both
      const mergeResult = await git.merge(['second']).catch(e => {
         if (e.git) {
            expect(e.message).toBe('CONFLICTS: ccc.txt:add/add, aaa.txt:content');
            return e.git;
         }

         throw e;
      });

      expect(mergeResult).toEqual(expect.objectContaining({
         failed: true,
         conflicts: [{'reason': 'add/add', 'file': 'ccc.txt'}, {'reason': 'content', 'file': 'aaa.txt'}],
      }));

   });

   it('multiple files updated and merged', async () => {
      const git = context.gitP(context.root);

      await git.checkout('first');
      const mergeResult = await git.merge(['second']);

      expect(mergeResult.failed).toBe(false);
   });

});
