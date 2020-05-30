/*
   The broken chains test assures the behaviour of both standard and Promise wrapped versions
   of the simple-git library.

   Failures (exit code other than zero and some content in the stderr output) cause the current
   queue to be truncated and no additional steps to be taken.

   In the case of a promise chain, the `catch` handler should be called on the first error
   and no other steps in the chain be executed.
 */
const Test = require('./include/runner');

describe('merge', () => {

   let context;

   beforeEach(async () => {
      context = Test.createContext();

      const git = context.gitP(context.root);

      await git.init();
      await git.checkout(['-b', 'first']);

      await context.fileP('aaa.txt', 'Some\nFile content\nhere');
      await context.fileP('bbb.txt', Array.from({length: 20}, () => 'bbb').join('\n'));

      await git.add(`*.txt`);
      await git.commit('first commit');
      await git.checkout(['-b', 'second', 'first']);

      await context.fileP('aaa.txt', 'Different\nFile content\nhere');
      await context.fileP('ccc.txt', 'Another file');

      await git.add(`*.txt`);
      await git.commit('second commit');
   });

   it('single file conflict', async () => {
      const git = context.gitP(context.root).silent(true);

      await git.checkout('first');
      await context.fileP('aaa.txt', 'Conflicting\nFile content\nhere');

      await git.add(`aaa.txt`);
      await git.commit('move first ahead of second');
      const mergeError = await git.merge(['second']).catch(e => {
         if (e.git) {
            expect(e.message).toBe('CONFLICTS: aaa.txt:content');
            return e.git;
         }

         throw e;
      });

      expect(mergeError.conflicts).toEqual([{file: 'aaa.txt', reason: 'content'}]);
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
