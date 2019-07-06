import expect from 'expect.js';
import { mockContextWithResponse } from './include/mock.context';
import { branch, branchLocal, deleteLocalBranch } from '../../src/api/branch';
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

   function givenDeletingTheBranch(branchName: string) {
      return context = mockContextWithResponse(`Deleted branch ${branchName} (was b190102).`);
   }

   function givenDeletingTheBranchFails(branchName: string) {
      return context = mockContextWithResponse(`error: branch '${branchName}' not found.`);
   }

   function givenListingBranches() {
      return context = mockContextWithResponse(`
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
* drschwabe-add-branches             063069b Merge branch 'add-branches' of https://github.com/drschwabe/git-js into drschwabe-add-branches
  master                             cb4be06 Release 1.30.0
`);
   }

   function thenTheCommandRunIs(options: string[]) {
      expect(context.exec.calledWith(
         ['branch', '-v', ...options]
      ));
   }

   function thenTheResultIs(result: any) {
      expect(result).to.eql([
         new BranchDeleteResponse(deletedBranchName, 'b190102')
      ]);
      expect(result[0]).to.be.a(BranchDeleteResponse);
   }

   beforeEach(() => deletedBranchName = 'branch-to-delete-' + Math.floor(Math.random() * 1000));
   afterEach(() => context = undefined);

   describe('verbosity', () => {

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

   });

   describe('local delete', () => {

      beforeEach(() => givenDeletingTheBranch(deletedBranchName));

      it('delete local branch with -d option', async () => {
         const result = await branch(context, ['-d', deletedBranchName]);

         thenTheCommandRunIs(['-d', deletedBranchName]);
         thenTheResultIs(result);
      });

      it('delete local branch with -D option', async () => {
         const options = ['-D', deletedBranchName];
         const result = await branch(context, options);

         thenTheCommandRunIs(options);
         thenTheResultIs(result);
      });

      it('delete local branch with --delete option', async () => {
         const options = ['--delete', deletedBranchName];
         const result = await branch(context, options);

         thenTheCommandRunIs(options);
         thenTheResultIs(result);
      });

      it('delete local branch with deleteLocalBranch', async () => {
         const result = await deleteLocalBranch(context, [deletedBranchName], false);

         thenTheCommandRunIs(['-d', deletedBranchName]);
         thenTheResultIs(result);
      });

      it('force delete local branch with deleteLocalBranch', async () => {
         const result = await deleteLocalBranch(context, [deletedBranchName], true);

         thenTheCommandRunIs(['-D', deletedBranchName]);
         thenTheResultIs(result);
      });

      it('handles local delete errors', async () => {
         const failureContext = givenDeletingTheBranchFails(deletedBranchName);

         expect(await deleteLocalBranch(failureContext, [deletedBranchName], false)).to.eql([
            new BranchDeleteResponse(deletedBranchName, null)
         ]);
      });

   });


   describe('branch-response parsing', () => {

      it('detached branches', () => {
         const branchSummary = BranchResponse.parse(`
* (detached from 1.6.0)              2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
`);
         expect(branchSummary).to.have.property('current', '1.6.0');
         expect(branchSummary).to.have.property('detached', true);
         expect(branchSummary.all).to.eql(['1.6.0', 'cflynn07-add-git-ignore', 'master']);
      });

      it(
         'detached head at branch', () => {
            const branchSummary = BranchResponse.parse(`
* (HEAD detached at origin/master)   2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
`);
            expect(branchSummary).to.have.property('current', 'origin/master');
            expect(branchSummary).to.have.property('detached', true);
            expect(branchSummary.all).to.eql(['origin/master', 'cflynn07-add-git-ignore', 'master']);
         });

      it(
         'detached head at commit', () => {
            var branchSummary = BranchResponse.parse(`
* (HEAD detached at 2b2dba2)         2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
`);
            expect(branchSummary).to.have.property('current', '2b2dba2');
            expect(branchSummary).to.have.property('detached', true);
            expect(branchSummary.all).to.eql(['2b2dba2', 'cflynn07-add-git-ignore', 'master']);
         });

   });

   it('gets branch with options array', async () => {
      await branch(givenListingBranches(), ['-v', '--sort=-committerdate']);

      thenTheCommandRunIs(['-v', '--sort=-committerdate']);
   });

   it('gets branch with options object', async () => {
      await branch(givenListingBranches(), {'-v': null, '--sort': '-committerdate'});

      thenTheCommandRunIs(['-v', '--sort=-committerdate']);
   });

   it('gets branch data', async () => {
      const result = await branch(givenListingBranches(), []);

      if (!isBranchResponse(result)) {
         throw new TypeError('Expected a BranchResponse');
      }

      expect(result).to.be.a(BranchResponse);

      expect(result.all).to.eql(['cflynn07-add-git-ignore', 'drschwabe-add-branches', 'master']);
      expect(result.current).to.be('drschwabe-add-branches');
      expect(result.branches.master)
         .to.have.property('label', 'Release 1.30.0');
      expect(result.branches.master)
         .to.have.property('commit', 'cb4be06');
   });

   it('get local branches data', async () => {
      const result = await branchLocal(context = mockContextWithResponse(`
* master                899725c [ahead 1] Add clean method
  remotes/origin/HEAD   -> origin/master
`));

      if (!isBranchResponse(result)) {
         throw new TypeError('Expected a BranchResponse');
      }

      expect(result.all).to.eql(['master']);
      thenTheCommandRunIs(['-v']);
   });

   function isBranchResponse(test: any): test is BranchResponse {
      return test instanceof BranchResponse;
   }
});
