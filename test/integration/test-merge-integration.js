'use strict';

const FS = require('fs');

/*
   The broken chains test assures the behaviour of both standard and Promise wrapped versions
   of the simple-git library.

   Failures (exit code other than zero and some content in the stderr output) cause the current
   queue to be truncated and no additional steps to be taken.

   In the case of a promise chain, the `catch` handler should be called on the first error
   and no other steps in the chain be executed.
 */
const Test = require('./include/runner');

const setUp = (context) => {
   const git = context.gitP(context.root);


   return context.gitP(context.root).init()
      .then(() => git.checkout(['-b', 'first']))
      .then(() => {
         FS.writeFileSync(`${context.root}/aaa.aaa`, 'Some\nFile content\nhere', 'utf8');
         FS.writeFileSync(`${context.root}/bbb.bbb`, Array.from({length:20}, () => 'bbb').join('\n'), 'utf8');
      })
      .then(() => git.add([`${context.root}/aaa.aaa`, `${context.root}/bbb.bbb`]))
      .then(() => git.commit('first commit'))
      .then(() => git.checkout(['-b', 'second', 'first']))
      .then(() => {
         FS.writeFileSync(`${context.root}/aaa.aaa`, 'Different\nFile content\nhere', 'utf8');
         FS.writeFileSync(`${context.root}/ccc.ccc`, 'Another file', 'utf8');
      })
      .then(() => git.add([`${context.root}/aaa.aaa`, `${context.root}/ccc.ccc`]))
      .then(() => git.commit('second commit'));
};

module.exports = {
   'single file conflict': new Test(setUp, function (context, assert) {
      const git = context.gitP(context.root);
      const result = context.deferred();

      Promise.resolve()
         .then(() => git.checkout('first'))
         .then(() => {
            FS.writeFileSync(`${context.root}/aaa.aaa`, 'Conflicting\nFile content\nhere', 'utf8');
         })
         .then(() => git.add([`${context.root}/aaa.aaa`]))
         .then(() => git.commit('move first ahead of second'))
         .then(() => git.merge(['second']))
         .then((res) => {
            result.resolve(new Error('Should have had merge conflicts'));
         })
         .catch(mergeError => {
            assert.equal(mergeError.message, 'CONFLICTS: aaa.aaa:content');
            assert.deepEqual(mergeError.git.conflicts, [{ file: 'aaa.aaa', reason: 'content' }]);
            result.resolve();
         });

      return result.promise;
   }),

   'multiple files conflicted': new Test(setUp, function (context, assert) {
      const git = context.gitP(context.root);
      const result = context.deferred();

      Promise.resolve()
         .then(() => git.checkout('second'))
         .then(() => {
            FS.writeFileSync(`${context.root}/bbb.bbb`, Array.from({length:19}, () => 'bbb').join('\n') + '\nBBB', 'utf8');
         })
         .then(() => git.add([`${context.root}/bbb.bbb`]))
         .then(() => git.commit('move second ahead of first'))       // second is ahead with both files

         .then(() => git.checkout('first'))                          // moves back in both files
         .then(() => {
            FS.writeFileSync(`${context.root}/aaa.aaa`, 'Conflicting\nFile content', 'utf8');
            FS.writeFileSync(`${context.root}/bbb.bbb`, 'BBB\n' + Array.from({length:19}, () => 'bbb').join('\n'), 'utf8');
            FS.writeFileSync(`${context.root}/ccc.ccc`, 'Totally Conflicting', 'utf8');
         })
         .then(() => git.add([`${context.root}/aaa.aaa`, `${context.root}/bbb.bbb`, `${context.root}/ccc.ccc`]))  // first ahead of second with conflicts on another
         .then(() => git.commit('move first ahead of second'))       // "another-file" modified in both
         .then(() => git.merge(['second']))
         .then((res) => {
            result.resolve(new Error('Should have had merge conflicts'));
         })
         .catch(err => {
            assert.equal(err.message, 'CONFLICTS: ccc.ccc:add/add, aaa.aaa:content');
            result.resolve();
         });

      return result.promise;
   }),

   'multiple files updated and merged': new Test(setUp, function (context, assert) {
      const git = context.gitP(context.root);
      const result = context.deferred();

      Promise.resolve()
         .then(() => git.checkout('first'))
         .then(() => git.merge(['second']))
         .then((res) => {
            assert.equal(res.failed, false);
            result.resolve();
         })
         .catch(err => {
            result.resolve(new Error('Should have no conflicts'));
         });

      return result.promise;
   })
};
