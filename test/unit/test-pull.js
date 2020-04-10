
const jestify = require('../jestify');
const {restore, Instance, theCommandRun, closeWith} = require('./include/setup');
const sinon = require('sinon');
const PullSummary = require('../../src/responses/PullSummary');

var git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.pull = {
   setUp (done) {
      git = Instance();
      done();
   },

   'pulls an insertion only change set' (test) {
      var pullSummary = PullSummary.parse(`From https://github.com/steveukx/git-js
 * branch            foo        -> FETCH_HEAD
Updating 1c57fa9..5b75063
Fast-forward
 src/responses/PullSummary.js | 2 ++
 1 file changed, 2 insertions(+)
`);

      test.same(pullSummary.summary.changes, 1);
      test.same(pullSummary.summary.insertions, 2);
      test.same(pullSummary.summary.deletions, 0);

      test.same(pullSummary.insertions['src/responses/PullSummary.js'], 2);
      test.done();
   },

   'pulls with spaces in names' (test) {
      git.pull(function (err, result) {
         test.same(['pull'], theCommandRun());
         test.same(result.files.length, 21);
         test.done();
      });

      closeWith(`
From git.kellpro.net:apps/templates
* branch            release/0.33.0 -> FETCH_HEAD
Updating 1c6e99e..2a5dc63
Fast-forward
 accounting_core.kjs        |  61 +++++++++++-----------
 accounting_core_report.kjs |  45 +++++++++-------
 ap.invoice.kjs             |   2 +-
 ar.deposit.kjs             |   6 +--
 ar.invoice_detail.kjs      |  16 +++---
 ar.receipt.kjs             |  10 +++-
 gl.bank_statement.kjs      |   6 +++
 gl.kjs                     | 106 ++++++++++++++++++++++++++------------
 kis.call.kjs               |   2 +
 kis.call_stats_report.kjs  | 289 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 kis.edit_recurring.kjs     |   8 +--
 kis.kdr_logs.kjs           |   8 ---
 kpo.batch_pay.kjs          |  19 ++++---
 kpo.fiscal_year.kjs        |  93 +++++++++++++++++++++++++++++----
 kpo.kjs                    |   2 +-
 kpo.payment.kjs            |   3 ++
 kpo.po_adjustment.kjs      |  82 +++++++++++++++++++++++------
 kpo.purchase_order.kjs     |  12 +++--
 kpo.reports.kjs            |  79 +++++++++++++++-------------
 kpo.warrant.kjs            |  17 +++---
 time_tracking.schedule.kjs | 342 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------------------------------
 21 files changed, 856 insertions(+), 352 deletions(-)
 create mode 100644 kis.call_stats_report.kjs
`);

   },

   'pulls with options' (test) {
      git.pull(null, null, {'--rebase': null}, function (err, result) {
         test.same(['pull', '--rebase'], theCommandRun());
         test.same(result.files, ['accounting_core.kjs', 'kis.call_stats_report.kjs']);
         test.done();
      });

      closeWith(`
From git.kellpro.net:apps/templates
* branch            release/0.33.0 -> FETCH_HEAD
Updating 1c6e99e..2a5dc63
Fast-forward
 accounting_core.kjs        |  61 +++++++++++-----------
 2 files changed, 856 insertions(+), 352 deletions(-)
 create mode 100644 kis.call_stats_report.kjs
`);
   },

   'pulls with options without branch detail' (test) {
      git.pull({'--no-rebase': null}, function (err, result) {
         test.same(['pull', '--no-rebase'], theCommandRun());
         test.same(result.files, ['accounting_core.kjs', 'kis.call_stats_report.kjs']);
         test.same(result.insertions, {'accounting_core.kjs': 11});
         test.same(result.deletions, {'accounting_core.kjs': 9});

         test.done();
      });

      closeWith(`
From git.kellpro.net:apps/templates
* branch            release/0.33.0 -> FETCH_HEAD
Updating 1c6e99e..2a5dc63
Fast-forward
 accounting_core.kjs        |  61 +++++++++++---------
 2 files changed, 856 insertions(+), 352 deletions(-)
 create mode 100644 kis.call_stats_report.kjs
`);
   },

   'pulls with rebase options with value' (test) {
      git.pull('origin', 'master', { '--rebase' : 'true' }, function (err, result) {
         test.same(['pull', 'origin', 'master', '--rebase=true'], theCommandRun());
         test.same(result.files, ['accounting_core.kjs', 'kis.call_stats_report.kjs']);
         test.done();
      });

      closeWith(`
From git.kellpro.net:apps/templates
* branch            release/0.33.0 -> FETCH_HEAD
Updating 1c6e99e..2a5dc63
Fast-forward
 accounting_core.kjs        |  61 +++++++++++-----------
 2 files changed, 856 insertions(+), 352 deletions(-)
 create mode 100644 kis.call_stats_report.kjs
`);

   },

   'pull summary with files added or deleted but not modified' (test) {
      const summary = PullSummary.parse(`

remote: Counting objects: 3, done.
remote: Total 3 (delta 1), reused 3 (delta 1), pack-reused 0
Unpacking objects: 100% (3/3), done.
From github.com:steveukx/git-js
   1a4d751..83ace81  foo        -> origin/foo
Updating 1a4d751..83ace81
Fast-forward
 something | 4 ++++
 temp      | 0
 2 files changed, 4 insertions(+)
 create mode 100644 something
 delete mode 100644 temp

      `);

      test.equal(summary.files.join(' '), 'something temp', 'found the added and removed files');
      test.same(summary.created, ['something'], 'found the added file');
      test.same(summary.deleted, ['temp'], 'found the removed (empty) file');
      test.done();
   }
};

jestify(exports);
