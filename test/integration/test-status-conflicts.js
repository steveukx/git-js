'use strict';

const { MergeConflict } = require('../../src/responses/MergeSummary');

/*
   Testing the ability to recognise conflicts in merge and status parsers
 */
const Test = require('./include/runner');

const setUp = (context) => {
   const git = context.gitP(context.root);


   return context.gitP(context.root).init()
      .then(() => {
         context.file('src', 'to-change.ext', 'Foo\nBar\nBaz');
         context.file('src', 'to-delete.ext', 'Foo\nBar\nBaz');
      })
      .then(() => git.add(`src/*`))
      .then(() => git.commit('first commit'))
      .then(() => git.checkout(['-b', 'new-branch']))
      .then(() => {
         context.file('src', 'to-change.ext', 'Foo\nChanged\nBaz');
         context.file('src', 'to-delete.ext', 'Foo\nChanged\nBaz');
      })
      .then(() => git.add(`src/*`))
      .then(() => git.commit('branch commit'))
      .then(() => git.checkout(['master']))
      ;
};

require('../jestify')({

   'multiple files conflicted': new Test(setUp, async function (context, assert) {
      const git = context.gitP(context.root).silent(true);

      context.file('src', 'to-change.ext', 'Foo\nAll New\nBaz');

      await git.rm(context.filePath('src', 'to-delete.ext'));
      await git.add('src/*');
      await git.commit('master commit');

      const mergeSummary = await doMerge(['new-branch', '--no-ff']);

      if (!mergeSummary) {
         return new Error('Unable to perform merge...');
      }

      assert.deepEqual(mergeSummary.conflicts, [
         new MergeConflict('modify/delete', 'src/to-delete.ext', { deleteRef: 'HEAD' }),
         new MergeConflict('content', 'src/to-change.ext'),
      ]);

      const status = await git.status();

      assert.deepEqual(status.conflicted, [
         'src/to-change.ext',
         'src/to-delete.ext',
      ]);

      async function doMerge (args) {
         let mergeSummary;

         try {
            mergeSummary = await git.merge(args);
         }
         catch (e) {
            mergeSummary = e.git;
         }

         return mergeSummary;
      }
   }),
});
