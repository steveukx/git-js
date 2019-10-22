import expect = require('expect');
import { SinonSandbox, createSandbox } from 'sinon';
import { PotentialError, SimpleGit, simpleGitBuilder } from '../../src';
import dependencies from '../../src/util/dependencies';
import { MockBuffer } from './include/mock-buffer';
import { MockChildProcess } from './include/mock-child-process';

describe('catfile', () => {

   let sandbox: SinonSandbox;
   let git: SimpleGit;

   let childProcess: any;

   function theCommandRun () {
      return childProcess.$args;
   }

   beforeEach(() => {
      sandbox = createSandbox();
      sandbox.stub(dependencies, 'buffer').returns(new MockBuffer(sandbox));
      sandbox.stub(dependencies, 'childProcess').returns(childProcess = new MockChildProcess(sandbox));
      git = simpleGitBuilder();
   });

   afterEach(() => sandbox.restore());

   it('displays tree for initial commit hash', (done) => {
      const commandOutput = `
         100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d    .gitignore
         100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81    .npmignore
         100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf    package.json
         100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a    readme.md
         040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541    src
      `;

      git.catFile(['-p', '366e4409'], function(err, result) {
         expect(err).toBeNull();
         expect(['cat-file', '-p', '366e4409']).toEqual(theCommandRun());
         expect(result).toBe(commandOutput);

         done();
      });

      childProcess.$closeWith(commandOutput);

   });

   it('displays valid usage when no arguments passed', (done) => {
      const errMsg = 'Please pass in a valid (tree/commit/object) hash';

      git.catFile((err: PotentialError, result?: string) => {
         expect(err).toBeNull();
         expect(['cat-file']).toEqual(theCommandRun());
         expect(result).toBe(errMsg);

         done();
      });

      childProcess.$closeWith(errMsg);
   });

   it('optionally returns a buffer of raw data', (done) => {
      git.binaryCatFile(['-p', 'HEAD:some-image.gif'], (err: PotentialError, result: any) => {
         expect(['cat-file', '-p', 'HEAD:some-image.gif']).toEqual(theCommandRun());
         expect(result.isBuffer).toBe(true);
         expect(result.toString.notCalled).toBe(true);


         expect('foo').toBe(result.toString());

         done();
      });

      childProcess.$closeWith('foo');
   });

});
