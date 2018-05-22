'use strict';

var _require = require('./include/setup'),
    theCommandRun = _require.theCommandRun,
    restore = _require.restore,
    Instance = _require.Instance,
    closeWith = _require.closeWith,
    errorWith = _require.errorWith;

var sinon = require('sinon');
var MergeSummary = require('../../src/responses/MergeSummary');

var git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.sandbox.create();
   sandbox.stub(console, 'error');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.merge = {
   setUp: function setUp(done) {
      git = Instance();
      done();
   },

   merge: function merge(test) {
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

   mergeFromTo: function mergeFromTo(test) {
      git.mergeFromTo('aaa', 'bbb', function (err) {
         test.same(['merge', 'aaa', 'bbb'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   mergeFromToWithOptions: function mergeFromToWithOptions(test) {
      git.mergeFromTo('aaa', 'bbb', ['x', 'y'], function (err) {
         test.same(['merge', 'aaa', 'bbb', 'x', 'y'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   mergeFromToWithBadOptions: function mergeFromToWithBadOptions(test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err) {
         test.same(['merge', 'aaa', 'bbb'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'names conflicts when they exist': function namesConflictsWhenTheyExist(test) {
      var mergeSummary = MergeSummary.parse('\nAuto-merging readme.md\nCONFLICT (content): Merge conflict in readme.md\nAutomatic merge failed; fix conflicts and then commit the result.\n');

      test.same(mergeSummary.failed, true);
      test.same(mergeSummary.conflicts, [{ reason: 'content', file: 'readme.md' }]);
      test.done();
   },

   'merge with fatal error': function mergeWithFatalError(test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err, mergeSummary) {
         test.same(null, mergeSummary);
         test.same('Some fatal error', err);
         test.done();
      });
      errorWith('Some fatal error');
      closeWith(128);
   },

   'merge with conflicts': function mergeWithConflicts(test) {
      git.mergeFromTo('aaa', 'bbb', 'x', function (err, mergeSummary) {
         test.same(true, err instanceof MergeSummary);
         test.same(true, err.failed);
         test.same(null, mergeSummary);
         test.done();
      });
      closeWith('\nAuto-merging readme.md\nCONFLICT (content): Merge conflict in readme.md\nAutomatic merge failed; fix conflicts and then commit the result.\n');
   },

   'multiple merges with some conflicts and some success': function multipleMergesWithSomeConflictsAndSomeSuccess(test) {
      var mergeSummary = MergeSummary.parse('\nAuto-merging ccc.ccc\nCONFLICT (add/add): Merge conflict in ccc.ccc\nAuto-merging bbb.bbb\nAuto-merging aaa.aaa\nCONFLICT (content): Merge conflict in aaa.aaa\nAutomatic merge failed; fix conflicts and then commit the result.\n');

      test.same(mergeSummary.failed, true);
      test.same(mergeSummary.conflicts, [{ reason: 'add/add', file: 'ccc.ccc' }, { reason: 'content', file: 'aaa.aaa' }]);
      test.same(mergeSummary.merges, ['ccc.ccc', 'bbb.bbb', 'aaa.aaa']);
      test.done();
   },

   'successful merge with some files updated': function successfulMergeWithSomeFilesUpdated(test) {
      var mergeSummary = MergeSummary.parse('\nUpdating 5826641..52c5cc6\nFast-forward\n aaa.aaa | 2 +-\n ccc.ccc | 1 +\n 50 files changed, 20 insertions(+), 1 deletion(-)\n create mode 100644 ccc.ccc\n');

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