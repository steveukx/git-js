'use strict';

const {theCommandRun, restore, Instance, closeWith} = require('./include/setup');
const sinon = require('sinon');

const DiffSummary = require('../../src/responses/DiffSummary');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   sandbox.stub(console, 'warn');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.diff = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'bin summary' (test) {
      const summary = DiffSummary.parse(`
 my-package.tar.gz | Bin 3163 -> 3244 bytes
 1 file changed, 0 insertions(+), 0 deletions(-)
 `);

      test.equal(summary.insertions, 0);
      test.equal(summary.deletions, 0);
      test.equal(summary.files.length, 1);
      test.same(summary.files[{
         file: 'my-package.tar.gz',
         before: 3163,
         after: 3244,
         binary: true
      }]);
      test.done();
   },

   'with summary' (test) {
      git.diffSummary(function (err, diffSummary) {
         test.same(['diff', '--stat=4096'], theCommandRun());
         test.equals(diffSummary.changed, 1);
         test.equals(diffSummary.insertions, 1);
         test.equals(diffSummary.deletions, 2);
         test.equals(diffSummary.files.length, 1);

         var diffFileSummary = diffSummary.files[0];
         test.equals(diffFileSummary.file, 'package.json');
         test.equals(diffFileSummary.changes, 3);
         test.equals(diffFileSummary.insertions, 1);
         test.equals(diffFileSummary.deletions, 2);
         test.done();
      });

      closeWith(`
         package.json | 3 +--
         1 file changed, 1 insertion(+), 2 deletions(-)
       `);
   },

   'with summary and options' (test) {
      git.diffSummary(['opt-a', 'opt-b'], function () {
         test.same(['diff', '--stat=4096', 'opt-a', 'opt-b'], theCommandRun());
         test.done();
      });

      closeWith(`
         package.json | 3 +--
         1 file changed, 1 insertion(+), 2 deletions(-)
    `);
   },

   'with summary and option' (test) {
      git.diffSummary('opt-a', function () {
         test.same(['diff', '--stat=4096', 'opt-a'], theCommandRun());
         test.done();
      });

      closeWith(`
         package.json | 3 +--
         1 file changed, 1 insertion(+), 2 deletions(-)
       `);
   },

   'with summary multiple files' (test) {
      var diffFileSummary;

      git.diffSummary(function (err, diffSummary) {
         test.same(['diff', '--stat=4096'], theCommandRun());
         test.equals(diffSummary.changed, 2);
         test.equals(diffSummary.insertions, 26);
         test.equals(diffSummary.deletions, 0);
         test.equals(diffSummary.files.length, 2);

         diffFileSummary = diffSummary.files[0];
         test.equals(diffFileSummary.file, 'src/git.js');
         test.equals(diffFileSummary.changes, 6);
         test.equals(diffFileSummary.insertions, 6);
         test.equals(diffFileSummary.deletions, 0);

         diffFileSummary = diffSummary.files[1];
         test.equals(diffFileSummary.file, 'test/testCommands.js');
         test.equals(diffFileSummary.changes, 20);
         test.equals(diffFileSummary.insertions, 20);
         test.equals(diffFileSummary.deletions, 0);

         test.done();
      });

      closeWith(`
         src/git.js           |  6 ++++++
         test/testCommands.js | 20 ++++++++++++++++++++
         2 files changed, 26 insertions(+)
       `);
   },

   'recognises files changed in modified time only' (test) {

      const summary = DiffSummary.parse(`
         abc | 0
         def | 1 +
         2 files changed, 1 insertion(+)
      `);

      test.deepEqual(summary.files, [
         { file: 'abc', changes: 0, insertions: 0, deletions: 0, binary: false },
         { file: 'def', changes: 1, insertions: 1, deletions: 0, binary: false },
      ]);

      test.done();
   },

   'recognises binary files' (test) {

      const summary = DiffSummary.parse(`
         some/image.png                                                     |                Bin 0 -> 9806 bytes
         1 file changed, 1 insertion(+)
      `);

      test.deepEqual(summary.files, [
         { file: 'some/image.png', before: 0, after: 9806, binary: true },
      ]);

      test.done();
   },

   'picks number of files changed from summary line' (test) {
      test.same(DiffSummary.parse('1 file changed, 1 insertion(+)').changed, 1);
      test.same(DiffSummary.parse('2 files changed, 1 insertion(+), 1 deletion(+)').changed, 2);

      test.done();
   }
};
