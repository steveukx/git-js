'use strict';

const {theCommandRun, restore, Instance, closeWith} = require('./include/setup');
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
