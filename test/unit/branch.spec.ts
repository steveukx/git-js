import expect from 'expect.js';
import { mockContextWithResponse } from './include/mock.context';
import { branch, deleteLocalBranch } from '../../src/api/branch';
import { BranchResponse } from '../../src/responses/branch.response';
import { BranchDeleteResponse } from '../../src/responses/branch-delete.response';

describe('branch-delete.response', () => {

   it('treats a hash as having been a success', () => {
      expect(new BranchDeleteResponse('branch', 'hash')).to.have.property('success', true);
   });

   it('treats null hash as having not been a success', () => {
      expect(new BranchDeleteResponse('branch', null)).to.have.property('success', false);
   });

});

describe('branch', () => {

   let context: any;
   let deletedBranchName: string;

   function givenDeletingTheBranch (branchName: string) {
      return context = mockContextWithResponse(`Deleted branch ${branchName} (was b190102).`)
   }

   function thenTheCommandRunIs (options: string[]) {
      expect(context.exec.calledWith(
         ['branch', '-v', ...options]
      ));
   }

   function thenTheResultIs (result: any) {
      expect(result).to.eql([
         new BranchDeleteResponse(deletedBranchName, 'b190102')
      ]);
      expect(result[0]).to.be.a(BranchDeleteResponse);
   }

   beforeEach(() => deletedBranchName = 'branch-to-delete-' + Math.floor(Math.random() * 1000));
   afterEach(() => context = undefined);

   it('handles verbosity being set by the user', async () => {
      const result = await branch(
         context = mockContextWithResponse(''), ['--list', '--remote', '-v']);

      expect(result).to.be.a(BranchResponse);
      expect(context.exec.calledWith(
         ['branch', '--list', '--remote', '-v']
      ));
   });

   it('handles verbosity not being set by the user', async () => {
      const result = await branch(
         context = mockContextWithResponse(''), ['--list', '--remote']);

      expect(result).to.be.a(BranchResponse);
      expect(context.exec.calledWith(
         ['branch', '-v', '--list', '--remote']
      ));
   });

   it('delete local branch with -d option', async () => {
      givenDeletingTheBranch(deletedBranchName);
      const result = await branch(context, ['-d', deletedBranchName]);

      thenTheCommandRunIs(['-d', deletedBranchName]);
      thenTheResultIs(result);
   });

   it('delete local branch with -D option', async () => {
      const options = ['-D', deletedBranchName];

      givenDeletingTheBranch(deletedBranchName);
      const result = await branch(context, options);

      thenTheCommandRunIs(options);
      thenTheResultIs(result);
   });

   it( 'delete local branch with --delete option', async () => {
      const options = ['--delete', deletedBranchName];
      givenDeletingTheBranch(deletedBranchName);

      const result = await branch(context, options);

      thenTheCommandRunIs(options);
      thenTheResultIs(result);
   });

   it('delete local branch with deleteLocalBranch', async () => {
      givenDeletingTheBranch(deletedBranchName);

      const result = await deleteLocalBranch(context, [deletedBranchName], false);

      thenTheCommandRunIs(['-d', deletedBranchName]);
      thenTheResultIs(result);
   });

   it('force delete local branch with deleteLocalBranch', async () => {
      givenDeletingTheBranch(deletedBranchName);

      const result = await deleteLocalBranch(context, [deletedBranchName], true);

      thenTheCommandRunIs(['-D', deletedBranchName]);
      thenTheResultIs(result);
   });

});

/*
const {theCommandRun, restore, Instance, closeWith} = require('./include/setup');
const sinon = require('sinon');
const BranchSummary = require('../../src/responses/BranchSummary');
const BranchDeleteSummary = require('../../src/responses/BranchDeleteSummary');

var git, sandbox;

function branchDeleteLog (branchName) {
   return `Deleted branch ${branchName} (was b190102).`;
}

function testBranchDelete (test, options, err, branchSummary) {
   test.same(['branch', '-v', ...options], theCommandRun());
   test.equals(true, branchSummary.success);
   test.done();
}

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

describe('branch', () => {



   it(

   'delete local branch errors', () => {
      git.deleteLocalBranch('new-branch', function (err, branchSummary) {
         test.ok(
            branchSummary instanceof BranchDeleteSummary,
            'Uses the BranchDeleteSummary response type'
         );
         test.equals(null, err);
         test.same(['branch', '-v', '-d', 'new-branch'], theCommandRun());
         test.equals('new-branch', branchSummary.branch);
         test.equals(null, branchSummary.hash);
         test.equals(false, branchSummary.success);
         test.done();
      });

      closeWith('error: branch \'new-branch\' not found.');
   });

   it(

   'detached branches', () => {
      var branchSummary = BranchSummary.parse('\
* (detached from 1.6.0)              2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

      test.equals('1.6.0', branchSummary.current);
      test.equals(true, branchSummary.detached);

      test.same(['1.6.0', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
      test.done();
   });

   it(

   'detached head at branch', () => {
      var branchSummary = BranchSummary.parse('\
* (HEAD detached at origin/master)   2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

      test.equals('origin/master', branchSummary.current);
      test.equals(true, branchSummary.detached);

      test.same(['origin/master', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
      test.done();
   });

   it(

   'detached head at commit', () => {
      var branchSummary = BranchSummary.parse('\
* (HEAD detached at 2b2dba2)         2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

      test.equals('2b2dba2', branchSummary.current);
      test.equals(true, branchSummary.detached);

      test.same(['2b2dba2', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
      test.done();
   });

   it(

   'gets branch with options array', () => {
      git.branch(['-v', '--sort=-committerdate'], function (err, data) {
         test.same(['branch', '-v', '--sort=-committerdate'], theCommandRun());
         test.done();
      });

      closeWith('');
   });

   it(

   'gets branch with options object', () => {
      git.branch({'-v': null, '--sort': '-committerdate'}, function (err, data) {
         test.same(['branch', '-v', '--sort=-committerdate'], theCommandRun());
         test.done();
      });

      closeWith('');
   });

   it(

   'gets branch data', () => {
      git.branch(function (err, branchSummary) {
         test.ok(branchSummary instanceof BranchSummary, 'Uses the BranchSummary response type');
         test.equals(null, err, 'not an error');
         test.equals('drschwabe-add-branches', branchSummary.current);
         test.same(['cflynn07-add-git-ignore', 'drschwabe-add-branches', 'master'], branchSummary.all);

         test.same('Release 1.30.0', branchSummary.branches.master.label);
         test.same('cb4be06', branchSummary.branches.master.commit);

         test.done();
      });

      closeWith('\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
* drschwabe-add-branches             063069b Merge branch \'add-branches\' of https://github.com/drschwabe/git-js into drschwabe-add-branches\n\
  master                             cb4be06 Release 1.30.0\n\
        ');
   });

   it(

   'get local branches data', () => {
      git.branchLocal(function (err, branchSummary) {
         test.ok(branchSummary instanceof BranchSummary, 'Uses the BranchSummary response type');
         test.equals(null, err, 'not an error');
         test.same(['master'], branchSummary.all);
         test.same(['branch', '-v'], theCommandRun());
         test.done();
      });
      closeWith('\
* master                899725c [ahead 1] Add clean method\n\
  remotes/origin/HEAD   -> origin/master\n\
        ');
   });
});
*/
