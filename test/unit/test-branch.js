'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');
const BranchSummary = require('../../src/responses/BranchSummary');
const BranchDeleteSummary = require('../../src/responses/BranchDeleteSummary');

var git, sandbox;

function branchDeleteLog (branchName) {
  return 'Deleted branch ' + branchName + ' (was b190102).';
}

function testBranchDelete (test, options, err, branchSummary) {
    test.ok(
      branchSummary instanceof BranchDeleteSummary, 
      'Uses the BranchDeleteSummary response type'
    );
    test.equals(null, err);
    test.same(['branch'].concat(options), setup.theCommandRun());
    test.equals('new-branch', branchSummary.branch);
    test.equals('b190102', branchSummary.hash);
    test.equals(true, branchSummary.success);
    test.done();
}

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

   'delete local branch with -d option': function (test) {
     var branchName = 'new-branch';
     var options = ['-d', branchName];
     var callback = testBranchDelete.bind(null, test, options);

     git.branch(options, callback);

     setup.closeWith(branchDeleteLog(branchName));
   },

   'delete local branch with -D option': function (test) {
     var branchName = 'new-branch';
     var options = ['-D', branchName];
     var callback = testBranchDelete.bind(null, test, options);

     git.branch(options, callback);

     setup.closeWith(branchDeleteLog(branchName));
   },

   'delete local branch with --delete option': function (test) {
     var branchName = 'new-branch';
     var options = ['--delete', branchName];
     var callback = testBranchDelete.bind(null, test, options);

     git.branch(options, callback);

     setup.closeWith(branchDeleteLog(branchName));
   },

   'delete local branch with #deleteLocalBranch': function (test) {
      var branchName = 'new-branch';
      var callback = testBranchDelete.bind(null, test, ['-d', branchName]);

      git.deleteLocalBranch(branchName, callback);

      setup.closeWith(branchDeleteLog(branchName));
   },

   'delete local branch errors': function (test) {
      git.deleteLocalBranch('new-branch', function (err, branchSummary) {
         test.ok(
           branchSummary instanceof BranchDeleteSummary, 
           'Uses the BranchDeleteSummary response type'
         );
         test.equals(null, err);
         test.same(['branch', '-d', 'new-branch'], setup.theCommandRun());
         test.equals('new-branch', branchSummary.branch);
         test.equals(null, branchSummary.hash);
         test.equals(false, branchSummary.success);
         test.done();
      });

      setup.closeWith('error: branch \'new-branch\' not found.');
   },

   'detached branches': function (test) {
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

  'detached head at branch': function (test) {
      var branchSummary = BranchSummary.parse('\
* (HEAD detached at origin/master)   2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

      test.equals('origin/master', branchSummary.current);
      test.equals(true, branchSummary.detached);

      test.same(['origin/master', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
      test.done();
   },

  'detached head at commit': function (test) {
      var branchSummary = BranchSummary.parse('\
* (HEAD detached at 2b2dba2)         2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

      test.equals('2b2dba2', branchSummary.current);
      test.equals(true, branchSummary.detached);

      test.same(['2b2dba2', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
      test.done();
   },

   'gets branch with options array': function (test) {
      git.branch(['-v', '--sort=-committerdate'], function (err, data) {
         test.same(['branch', '-v', '--sort=-committerdate'], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('');
   },

   'gets branch with options object': function (test) {
      git.branch({ '-v': null, '--sort': '-committerdate'}, function (err, data) {
         test.same(['branch', '-v', '--sort=-committerdate'], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('');
   },

   'gets branch data': function (test) {
      git.branch(function (err, branchSummary) {
         test.ok(branchSummary instanceof BranchSummary, 'Uses the BranchSummary response type');
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
   },

    'get local branches data': function(test) {
      git.branchLocal(function (err, branchSummary) {
         test.ok(branchSummary instanceof BranchSummary, 'Uses the BranchSummary response type');
         test.equals(null, err, 'not an error');
         test.same(['master'], branchSummary.all);
         test.same(['branch', '-v'], setup.theCommandRun());
         test.done();
      });
       setup.closeWith('\
* master                899725c [ahead 1] Add clean method\n\
  remotes/origin/HEAD   -> origin/master\n\
        ');
    }
};
