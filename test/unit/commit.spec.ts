import expect = require('expect');
import dependencies from '../../src/util/dependencies';
import { MockBuffer } from './include/mock-buffer';
import { PotentialError, SimpleGit, simpleGitBuilder } from '../../src';
import { MockChildProcess } from './include/mock-child-process';
import { SinonSandbox, createSandbox } from 'sinon';
import { CommitSummary, commitSummaryParser } from '../../src/responses';

describe('commit', () => {

   let sandbox: SinonSandbox;
   let git: SimpleGit;

   let childProcess: any;

   beforeEach(() => {
      sandbox = createSandbox();
      sandbox.stub(dependencies, 'buffer').returns(new MockBuffer(sandbox));
      sandbox.stub(dependencies, 'childProcess').returns(childProcess = new MockChildProcess(sandbox));
      git = simpleGitBuilder().silent(true);
   });

   afterEach(() => sandbox.restore());

   it('amend commit', (done) => {
      git.commit('some message', {'--amend': null}, () => {
         expect(['commit', '-m', 'some message', '--amend']).toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith('');
   });

   it('commit with an author set', (done) => {
      git.commit('some message', 'fileName.ext', {'--author': `"Some Author <some@author.com>"`}, (err, summary) => {
         expect(
            ['commit', '-m', 'some message', 'fileName.ext', '--author="Some Author <some@author.com>"']
         ).toEqual(childProcess.$lastCommandRun);

         expect(summary && summary.author).toEqual({
            email: 'some@author.com',
            name: 'Some Author'
         });

         done();
      });

      childProcess.$closeWith(`

[foo 8f7d107] done
Author: Some Author <some@author.com>
1 files changed, 2 deletions(-)

      `);
   });

   it('commit with single file specified', (done) => {
      git.commit('some message', 'fileName.ext', (err: PotentialError, commit?: CommitSummary) => {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('unitTests').toEqual(commit.branch);
         expect('44de1ee').toEqual(commit.commit);
         expect(3).toEqual(commit.summary.changes);
         expect(12).toEqual(commit.summary.deletions);
         expect(29).toEqual(commit.summary.insertions);

         expect(['commit', '-m', 'some message', 'fileName.ext']).toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith(`
         [unitTests 44de1ee] Add nodeunit test runner
         3 files changed, 29 insertions(+), 12 deletions(-)
         create mode 100644 src/index.js`);
   });

   it('commit with single file specified and multiple line commit', (done) => {
      git.commit(['some', 'message'], 'fileName.ext', (err: PotentialError, commit?: CommitSummary) => {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('unitTests').toEqual(commit.branch);
         expect('44de1ee').toEqual(commit.commit);
         expect(3).toEqual(commit.summary.changes);
         expect(12).toEqual(commit.summary.deletions);
         expect(29).toEqual(commit.summary.insertions);

         expect(['commit', '-m', 'some', '-m', 'message', 'fileName.ext']).toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith(`
         [unitTests 44de1ee] Add nodeunit test runner
         3 files changed, 29 insertions(+), 12 deletions(-)
         create mode 100644 src/index.js`);
   });

   it('commit with multiple files specified', (done) => {
      git.commit('some message', ['fileName.ext', 'anotherFile.ext'], (err: PotentialError, commit?: CommitSummary) => {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('branchNameInHere').toEqual(commit.branch);
         expect('CommitHash').toEqual(commit.commit);
         expect(3).toEqual(commit.summary.changes);
         expect(12).toEqual(commit.summary.deletions);
         expect(29).toEqual(commit.summary.insertions);

         expect(['commit', '-m', 'some message', 'fileName.ext', 'anotherFile.ext'])
            .toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith('[branchNameInHere CommitHash] Add nodeunit test runner\n\
        3 files changed, 29 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
   });

   it('commit with multiple files specified and multiple line commit', (done) => {
      git.commit(['some', 'message'], ['fileName.ext', 'anotherFile.ext'], (err: PotentialError, commit?: CommitSummary) => {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('branchNameInHere').toEqual(commit.branch);
         expect('CommitHash').toEqual(commit.commit);
         expect(3).toEqual(commit.summary.changes);
         expect(12).toEqual(commit.summary.deletions);
         expect(29).toEqual(commit.summary.insertions);

         expect(['commit', '-m', 'some', '-m', 'message', 'fileName.ext', 'anotherFile.ext'])
            .toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith('[branchNameInHere CommitHash] Add nodeunit test runner\n\
        3 files changed, 29 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
   });

   it('commit with no files specified', (done) => {
      git.commit('some message', function (err: PotentialError, commit?: CommitSummary) {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('branchNameInHere').toEqual(commit.branch);
         expect('CommitHash').toEqual(commit.commit);
         expect(3).toEqual(commit.summary.changes);
         expect(12).toEqual(commit.summary.deletions);
         expect(10).toEqual(commit.summary.insertions);

         expect(['commit', '-m', 'some message']).toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith('[branchNameInHere CommitHash] Add nodeunit test runner\n\
        3 files changed, 10 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
   });

   it('commit with no files specified and multiple line commit', (done) => {
      git.commit(['some', 'message'], (err: PotentialError, commit?: CommitSummary) => {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('branchNameInHere').toEqual(commit.branch);
         expect('CommitHash').toEqual(commit.commit);
         expect(3).toEqual(commit.summary.changes);
         expect(12).toEqual(commit.summary.deletions);
         expect(10).toEqual(commit.summary.insertions);

         expect(['commit', '-m', 'some', '-m', 'message']).toEqual(childProcess.$lastCommandRun);

         done();
      });

      childProcess.$closeWith('[branchNameInHere CommitHash] Add nodeunit test runner\n\
        3 files changed, 10 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
   });

   it('commit when no files are staged', (done) => {
      git.commit('some message', function (err: PotentialError, commit?: CommitSummary) {
         if (!commit) {
            throw new Error('Failed to return a CommitSummary');
         }

         expect('').toEqual(commit.branch);
         expect('').toEqual(commit.commit);
         expect(0).toEqual(commit.summary.changes);
         expect(0).toEqual(commit.summary.deletions);
         expect(0).toEqual(commit.summary.insertions);

         done();
      });

      childProcess.$closeWith('On branch master\n\
        Your branch is ahead of \'origin/master\' by 1 commit.\n\
           (use "git push" to publish your local commits)\n\n\
        Changes not staged for commit:\n\
        modified:   src/some-file.js\n\
        modified:   src/another-file.js\n\n\
        no changes added to commit\n\
        ');
   });

   it('commit summary', () => {
      const commitSummary = commitSummaryParser(`

[branchNameInHere CommitHash] Add nodeunit test runner\n\
3 files changed, 10 insertions(+), 12 deletions(-)\n\
create mode 100644 src/index.js

      `);

      expect(null).toEqual(commitSummary.author);
      expect(12).toEqual(commitSummary.summary.deletions);
      expect(10).toEqual(commitSummary.summary.insertions);
      expect(3).toEqual(commitSummary.summary.changes);

   });

   it('commit summary with author data', () => {
      let commitSummary = commitSummaryParser(`

[branchNameInHere CommitHash] Add nodeunit test runner
Author: Some One <some@one.com>
3 files changed, 10 insertions(+), 12 deletions(-)
create mode 100644 src/index.js

      `);

      expect({
         name: 'Some One',
         email: 'some@one.com'
      }).toEqual(commitSummary.author);
      expect(12).toEqual(commitSummary.summary.deletions);
      expect(10).toEqual(commitSummary.summary.insertions);
      expect(3).toEqual(commitSummary.summary.changes);
   });

});

