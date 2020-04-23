
const jestify = require('../jestify');

const {theCommandRun, restore, Instance, closeWith, errorWith} = require('./include/setup');
const sinon = require('sinon');
const MergeSummary = require('../../src/responses/MergeSummary');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   sandbox.stub(console, 'error');
   done();
};

exports.tearDown = function (done) {
   restore(sandbox);
   done();
};

exports.merge = {
   setUp (done) {
      git = Instance();
      done();
   },

   merge (test) {
      git.merge(['--no-ff', 'someOther-master'], function (err) {
         test.same(['merge', '--no-ff', 'someOther-master'], theCommandRun());
         test.done();
      });
      closeWith('Merge made by the \'recursive\' strategy.\n\
           src/File.js | 16 ++++++++++++----\n\
           test/fileTest.js     | 24 ++++++++++++++++++++++++\n\
           2 files changed, 36 insertions(+), 4 deletions(-)\n\
        ');
   },

   mergeFromTo (test) {
      git.mergeFromTo('aaa', 'bbb', function (err) {
         test.same(['merge', 'aaa', 'bbb'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   mergeFromToWithOptions (test) {
      git.mergeFromTo('aaa', 'bbb', ['x', 'y'], function (err) {
         test.same(['merge', 'aaa', 'bbb', 'x', 'y'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   mergeFromToWithBadOptions (test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err) {
         test.same(['merge', 'aaa', 'bbb'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'names conflicts when they exist' (test) {
      const mergeSummary = MergeSummary.parse(`
Auto-merging readme.md
CONFLICT (content): Merge conflict in readme.md
Automatic merge failed; fix conflicts and then commit the result.
`);

      test.same(mergeSummary.failed, true);
      test.same(mergeSummary.conflicts, [
         { reason: 'content', file: 'readme.md' }
      ]);
      test.done();
   },

   'names modify/delete conflicts when deleted by them' (test) {
      const mergeSummary = MergeSummary.parse(`
Auto-merging readme.md
CONFLICT (modify/delete): readme.md deleted in origin/master and modified in HEAD. Version HEAD of readme.md left in tree.
Automatic merge failed; fix conflicts and then commit the result.
`);
      test.same(mergeSummary.failed, true);
      test.same(mergeSummary.conflicts, [
         {
            reason: 'modify/delete',
            file: 'readme.md',
            meta: { deleteRef: 'origin/master' }
         }
      ]);
      test.done();
   },

   'names modify/delete conflicts when deleted by us' (test) {
      const mergeSummary = MergeSummary.parse(`
Auto-merging readme.md
CONFLICT (modify/delete): readme.md deleted in HEAD and modified in origin/master. Version origin/master of readme.md left in tree.
Automatic merge failed; fix conflicts and then commit the result.
`);

      test.same(mergeSummary.failed, true);
      test.same(mergeSummary.conflicts, [
         {
            reason: 'modify/delete',
            file: 'readme.md',
            meta: { deleteRef: 'HEAD' }
         }
      ]);
      test.done();
   },

   'merge with fatal error' (test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err, mergeSummary) {
         test.same(null, mergeSummary);
         test.same('Some fatal error', err.message);
         test.done();
      });
      errorWith('Some fatal error');
      closeWith(128);
   },

   'merge with conflicts' (test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err, mergeSummary) {
         test.same(true, err instanceof MergeSummary);
         test.same(true, err.failed);
         test.same(null, mergeSummary);
         test.done();
      });
      closeWith(`
Auto-merging readme.md
CONFLICT (content): Merge conflict in readme.md
Automatic merge failed; fix conflicts and then commit the result.
`);
   },

   'multiple merges with some conflicts and some success' (test) {
      const mergeSummary = MergeSummary.parse(`
Auto-merging ccc.ccc
CONFLICT (add/add): Merge conflict in ccc.ccc
Auto-merging bbb.bbb
Auto-merging aaa.aaa
CONFLICT (content): Merge conflict in aaa.aaa
Automatic merge failed; fix conflicts and then commit the result.
`);

      test.same(mergeSummary.failed, true);
      test.same(mergeSummary.conflicts, [
         { reason: 'add/add', file: 'ccc.ccc' },
         { reason: 'content', file: 'aaa.aaa' }
      ]);
      test.same(mergeSummary.merges, [
         'ccc.ccc',
         'bbb.bbb',
         'aaa.aaa'
      ]);
      test.done();
   },

   'successful merge with some files updated' (test) {
      const mergeSummary = MergeSummary.parse(`
Updating 5826641..52c5cc6
Fast-forward
 aaa.aaa | 2 +-
 ccc.ccc | 1 +
 50 files changed, 20 insertions(+), 1 deletion(-)
 create mode 100644 ccc.ccc
`);

      test.same(mergeSummary.failed, false);
      test.same(mergeSummary.conflicts, []);
      test.same(mergeSummary.merges, []);
      test.same(mergeSummary.summary, {
         changes: 50,
         insertions: 20,
         deletions: 1
      });
      test.done();
   }
};

jestify(exports);
