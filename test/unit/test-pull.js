'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');
const PullSummary = require('../../src/responses/PullSummary');

var git, sandbox;

exports.setUp = function (done) {
   setup.restore();
   sandbox = sinon.sandbox.create();
   done();
};

exports.tearDown = function (done) {
   setup.restore();
   sandbox.restore();
   done();
};

exports.pull = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'pulls an insertion only change set': function (test) {
      var pullSummary = PullSummary.parse('From https://github.com/steveukx/git-js\n\
 * branch            foo        -> FETCH_HEAD\n\
Updating 1c57fa9..5b75063\n\
Fast-forward\n\
 src/responses/PullSummary.js | 2 ++\n\
 1 file changed, 2 insertions(+)\n\
');

      test.same(pullSummary.summary.changes, 1);
      test.same(pullSummary.summary.insertions, 2);
      test.same(pullSummary.summary.deletions, 0);

      test.same(pullSummary.insertions['src/responses/PullSummary.js'], 2);
      test.done();
   },

   'pulls with spaces in names': function (test) {
      git.pull(function (err, result) {
         test.same(['pull'], setup.theCommandRun());
         test.same(result.files.length, 21);
         test.done();
      });

      setup.closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 accounting_core_report.kjs |  45 +++++++++-------\n\
 ap.invoice.kjs             |   2 +-\n\
 ar.deposit.kjs             |   6 +--\n\
 ar.invoice_detail.kjs      |  16 +++---\n\
 ar.receipt.kjs             |  10 +++-\n\
 gl.bank_statement.kjs      |   6 +++\n\
 gl.kjs                     | 106 ++++++++++++++++++++++++++------------\n\
 kis.call.kjs               |   2 +\n\
 kis.call_stats_report.kjs  | 289 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\
 kis.edit_recurring.kjs     |   8 +--\n\
 kis.kdr_logs.kjs           |   8 ---\n\
 kpo.batch_pay.kjs          |  19 ++++---\n\
 kpo.fiscal_year.kjs        |  93 +++++++++++++++++++++++++++++----\n\
 kpo.kjs                    |   2 +-\n\
 kpo.payment.kjs            |   3 ++\n\
 kpo.po_adjustment.kjs      |  82 +++++++++++++++++++++++------\n\
 kpo.purchase_order.kjs     |  12 +++--\n\
 kpo.reports.kjs            |  79 +++++++++++++++-------------\n\
 kpo.warrant.kjs            |  17 +++---\n\
 time_tracking.schedule.kjs | 342 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------------------------------\n\
 21 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');

   },

   'pulls with options': function (test) {
      git.pull(null, null, {'--rebase': null}, function (err, result) {
         test.same(['pull', '--rebase'], setup.theCommandRun());
         test.same(result.files.length, 1);
         test.done();
      });

      setup.closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 2 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');
   },

   'pulls with options without branch detail': function (test) {
      git.pull({'--no-rebase': null}, function (err, result) {
         test.same(['pull', '--no-rebase'], setup.theCommandRun());
         test.same(result.files.length, 1);
         test.done();
      });

      setup.closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 2 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');
   },

   'pulls with rebase options with value': function (test) {
      git.pull('origin', 'master', { '--rebase' : 'true' }, function (err, result) {
         test.same(['pull', 'origin', 'master', '--rebase=true'], setup.theCommandRun());
         test.same(result.files.length, 1);
         test.done();
      });

      setup.closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 2 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');

   }
};
