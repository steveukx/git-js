import expect = require('expect');
import { SinonSandbox, createSandbox } from 'sinon';
import { simpleGitBuilder, SimpleGit } from '../../src';
import dependencies from '../../src/util/dependencies';
import { MockChildProcess } from './include/mock-child-process';
import { MockBuffer } from './include/mock-buffer';

describe('stash', () => {

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

   it('stash working directory', () => {
      git.stash();
      expect(theCommandRun()).toEqual(['stash']);
   });

   it('stash pop', (done: (err: any) => void) => {
      git.stash(['pop'], (err) => {
         expect(theCommandRun()).toEqual(['stash', 'pop']);
         done(err);
      });

      childProcess.$closeWith();
   });

   it('stash with options no handler', () => {
      git.stash(['branch', 'some-branch']);

      childProcess.$closeWith();
      expect(['stash', 'branch', 'some-branch']).toEqual(theCommandRun());
   });

});
