'use strict';

const {theCommandRun, restore, Instance, closeWith, errorWith} = require('./include/setup');
const sinon = require('sinon');
const MergeSummary = require('../../src/responses/MergeSummary');

var git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.sandbox.create();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.merge = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   merge: function (test) {
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

   mergeFromTo: function (test) {
      git.mergeFromTo('aaa', 'bbb', function (err) {
         test.same(['merge', 'aaa', 'bbb'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   mergeFromToWithOptions: function (test) {
      git.mergeFromTo('aaa', 'bbb', ['x', 'y'], function (err) {
         test.same(['merge', 'aaa', 'bbb', 'x', 'y'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   mergeFromToWithBadOptions: function (test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err) {
         test.same(['merge', 'aaa', 'bbb'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'names conflicts when they exist': function (test) {
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

   'merge with fatal error': function (test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err, mergeSummary) {
         test.same(null, mergeSummary);
         test.same('Some fatal error', err);
         test.done();
      });
      errorWith('Some fatal error');
      closeWith(128);
   },

   'merge with conflicts': function (test) {
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

   'multiple merges with some conflicts and some success': function (test) {
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

   'successful merge with some files updated': function (test) {
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
