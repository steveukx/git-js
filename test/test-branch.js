'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');

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

exports.branch = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'delete local branch': function (test) {
      git.deleteLocalBranch('new-branch', function (err, result) {
         test.equals(null, err);
         test.same(['branch', '-d', 'new-branch'], setup.theCommandRun());
         test.equals('new-branch', result.branch);
         test.equals('b190102', result.hash);
         test.equals(true, result.success);
         test.done();
      });

      setup.closeWith('Deleted branch new-branch (was b190102).');
   },

   'delete local branch errors': function (test) {
      git.deleteLocalBranch('new-branch', function (err, result) {
         test.equals(null, err);
         test.same(['branch', '-d', 'new-branch'], setup.theCommandRun());
         test.equals('new-branch', result.branch);
         test.equals(null, result.hash);
         test.equals(false, result.success);
         test.done();
      });

      setup.closeWith('error: branch \'new-branch\' not found.');
   },

   'detached branches': function (test) {
      var BranchSummary = require('../src/BranchSummary');
      var branchSummary = BranchSummary.parse('\
* (detached from 1.6.0)              2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

      test.equals('1.6.0', branchSummary.current);
      test.equals(true, branchSummary.detached);

      test.same(['1.6.0', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
      test.done();
   },

   'gets branch data': function (test) {
      git.branch(function (err, branchSummary) {
         test.ok(branchSummary instanceof require('../src/BranchSummary'), 'Uses the BranchSummary response type');
         test.equals(null, err, 'not an error');
         test.equals('drschwabe-add-branches', branchSummary.current);
         test.same(['cflynn07-add-git-ignore', 'drschwabe-add-branches', 'master'], branchSummary.all);

         test.same('Release 1.30.0', branchSummary.branches.master.label);
         test.same('cb4be06', branchSummary.branches.master.commit);

         test.done();
      });

      setup.closeWith('\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
* drschwabe-add-branches             063069b Merge branch \'add-branches\' of https://github.com/drschwabe/git-js into drschwabe-add-branches\n\
  master                             cb4be06 Release 1.30.0\n\
        ');
   }
};
