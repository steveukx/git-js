import expect = require('expect');
import { SinonSandbox, createSandbox } from 'sinon';
import { simpleGitBuilder, SimpleGit, PotentialError } from '../../src';
import { BranchDeletion, BranchSummary, branchSummaryParser } from '../../src/responses';
import dependencies from '../../src/util/dependencies';
import Done = Mocha.Done;

describe('branch', () => {

   let sandbox: SinonSandbox;
   let git: SimpleGit;

   let childProcess: any;

   const branchDeleteLog = (branchName: string) => `Deleted branch ${branchName} (was b190102).`;

   const testMultiBranchDelete = (done: Done, options: string[], results: Array<string | null> = ['b190102']) => {
      return (err: PotentialError, deletions?: BranchDeletion[]) => {

         expect(err).toBe(null);
         expect(Array.isArray(deletions)).toBe(true);
         expect(['branch', '-v', ...options]).toEqual(theCommandRun());

         const branchDeletions: BranchDeletion[] = deletions || [];
         expect(branchDeletions.length).toBe(results.length);
         branchDeletions.forEach((deletion: BranchDeletion, index: number) => {
            expect('new-branch').toEqual(deletion.branch);
            expect(deletion.hash).toEqual(results[index]);
            expect(deletion.success).toEqual(results[index] !== null);
         });

         done();
      };
   };

   const testBranchDelete = (done: Done, options: string[], success = true, hash: string | null = 'b190102'):
      (err: PotentialError, branchSummary?: BranchDeletion) => void =>
      (err: PotentialError, branchSummary?: BranchDeletion) => {
         expect(branchSummary instanceof BranchDeletion).toBe(true);
         expect(err).toBe(null);
         expect(['branch', '-v', ...options]).toEqual(theCommandRun());

         expect('new-branch').toEqual(branchSummary && branchSummary.branch);
         expect(hash).toEqual(branchSummary && branchSummary.hash);
         expect(success).toEqual(branchSummary && branchSummary.success);
         done();
      };

   function theCommandRun() {
      return childProcess && childProcess.$args;
   }

   beforeEach(() => {
      sandbox = createSandbox();
      sandbox.stub(dependencies, 'buffer').returns({
         from() {
         },
         concat(data: any[]) {
            return {
               isBuffer: true,
               data,
               toString() {
                  return data.join('\n');
               }
            }
         },
      });

      sandbox.stub(dependencies, 'childProcess').returns({
         spawn($binary: string, $args: string[], $options: any) {
            const $events: { [key: string]: any[] } = {};

            const addEvent = (type: string, handler: any) => {
               ($events[type] = $events[type] || []).push(handler);
            };

            const runHandlers = (type: string, data: any) => {
               $events.hasOwnProperty(type) && $events[type].forEach(handler => handler(data));
            };

            return childProcess = {
               $binary,
               $args,
               $options,

               $closeWith(data = '', exitCode = 0) {
                  runHandlers('stdout', data);
                  runHandlers('exit', exitCode);
               },

               on: sandbox.spy((event, handler) => addEvent(event, handler)),
               stdout: {on: sandbox.spy((type, handler) => addEvent('stdout', handler))},
               stderr: {on: sandbox.spy((type, handler) => addEvent('stderr', handler))},
            }
         }
      });
      git = simpleGitBuilder();
   });

   afterEach(() => sandbox.restore());

   it('handles verbosity being set by the user', (done) => {
      git.branch(['--list', '--remote', '-v'], () => {
         expect(['branch', '--list', '--remote', '-v']).toEqual(theCommandRun());
         done();
      });

      childProcess.$closeWith('');
   });

   it('handles verbosity not being set by the user', (done) => {
      git.branch(['--list', '--remote'], () => {
         expect(['branch', '-v', '--list', '--remote']).toEqual(theCommandRun());
         done();
      });

      childProcess.$closeWith('');
   });

   describe('deletes', () => {

      it('delete local branch with -d option', (done) => {
         const branchName = 'new-branch';
         const options = ['-d', branchName];
         const callback = testMultiBranchDelete(done, options);

         git.branch(options, callback);

         childProcess.$closeWith(branchDeleteLog(branchName));
      });

      it('delete local branch with -D option', (done) => {
         const branchName = 'new-branch';
         const options = ['-D', branchName];
         const callback = testMultiBranchDelete(done, options);

         git.branch(options, callback);

         childProcess.$closeWith(branchDeleteLog(branchName));
      });

      it('delete local branch with --delete option', (done) => {
         const branchName = 'new-branch';
         const options = ['--delete', branchName];
         const callback = testMultiBranchDelete(done, options);

         git.branch(options, callback);

         childProcess.$closeWith(branchDeleteLog(branchName));
      });

      it('delete local branch with #deleteLocalBranch', (done) => {
         const branchName = 'new-branch';
         git.deleteLocalBranch(branchName, testBranchDelete(done, ['-d', branchName]));

         childProcess.$closeWith(branchDeleteLog(branchName));
      });

      it('delete multiple local branches with #deleteLocalBranch', (done) => {
         const branchName = 'new-branch';
         git.deleteLocalBranch([branchName], testMultiBranchDelete(done, ['-d', branchName]));

         childProcess.$closeWith(branchDeleteLog(branchName));
      });

      it('delete local branch errors', (done) => {
         const branchName = 'new-branch';
         git.deleteLocalBranch(branchName, testBranchDelete(done, ['-d', branchName], false, null));

         childProcess.$closeWith(`error: branch 'new-branch' not found.`);
      });
   });

   it('detached branches', () => {
      const branchSummary = branchSummaryParser(`
* (detached from 1.6.0)              2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
`);

      expect('1.6.0').toBe(branchSummary.current);
      expect(true).toBe(branchSummary.detached);

      expect(['1.6.0', 'cflynn07-add-git-ignore', 'master']).toEqual(branchSummary.all);
   });

   it('detached head at branch', () => {
      const branchSummary = branchSummaryParser(`
* (HEAD detached at origin/master)   2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
`);

      expect('origin/master').toBe(branchSummary.current);
      expect(true).toBe(branchSummary.detached);

      expect(['origin/master', 'cflynn07-add-git-ignore', 'master']).toEqual(branchSummary.all);
   });

   it('detached head at commit', () => {
      const branchSummary = branchSummaryParser(`
* (HEAD detached at 2b2dba2)         2b2dba2 Add tests for commit
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
  master                             cb4be06 Release 1.30.0
`);

      expect('2b2dba2').toBe(branchSummary.current);
      expect(true).toBe(branchSummary.detached);

      expect(['2b2dba2', 'cflynn07-add-git-ignore', 'master']).toEqual(branchSummary.all);
   });

   it('gets branch with options array', (done) => {
      git.branch(['-v', '--sort=-committerdate'], () => {
         expect(['branch', '-v', '--sort=-committerdate']).toEqual(theCommandRun());
         done();
      });

      childProcess.$closeWith('');
   });

   it('gets branch with options object', (done) => {
      git.branch({'-v': null, '--sort': '-committerdate'}, () => {
         expect(['branch', '-v', '--sort=-committerdate']).toEqual(theCommandRun());
         done();
      });

      childProcess.$closeWith('');
   });

   it('gets branch data', (done) => {
      git.branch((err: PotentialError, response?: BranchSummary) => {
         expect(response instanceof BranchSummary).toBe(true);
         expect(err).toBeNull();

         const branchSummary: BranchSummary = <BranchSummary>response;
         expect('drschwabe-add-branches').toBe(branchSummary.current);
         expect(['cflynn07-add-git-ignore', 'drschwabe-add-branches', 'master']).toEqual(branchSummary.all);

         expect('Release 1.30.0').toBe(branchSummary.branches.master.label);
         expect('cb4be06').toBe(branchSummary.branches.master.commit);

         done();
      });

      childProcess.$closeWith(`
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces
* drschwabe-add-branches             063069b Merge branch 'add-branches' of https://github.com/drschwabe/git-js into drschwabe-add-branches
  master                             cb4be06 Release 1.30.0
        `);
   });

   it('get local branches data', (done) => {
      git.branchLocal((err: PotentialError, response?: BranchSummary) => {
         const branchSummary = <BranchSummary>response;

         expect(branchSummary instanceof BranchSummary).toBe(true);
         expect(err).toBeNull();
         expect(['master']).toEqual(branchSummary.all);
         expect(['branch', '-v']).toEqual(theCommandRun());
         done();
      });

      childProcess.$closeWith(`
* master                899725c [ahead 1] Add clean method
  remotes/origin/HEAD   -> origin/master
        `);
   });

});
