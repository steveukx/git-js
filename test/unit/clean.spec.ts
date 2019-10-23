import dependencies from '../../src/util/dependencies';
import { MockBuffer } from './include/mock-buffer';
import { PotentialError, SimpleGit, simpleGitBuilder } from '../../src';
import { MockChildProcess } from './include/mock-child-process';
import { SinonSandbox, createSandbox } from 'sinon';
import expect = require('expect');

describe('catfile', () => {

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

   it('cleans with dfx', (done) => {
      git.clean('dfx', (err: PotentialError, data?: string) => {
         expect(err).toBeNull();
         expect(['clean', '-dfx']).toEqual(childProcess.$lastCommandRun);
         done();
      });
      childProcess.$closeWith('');
   });

   it('missing required n or f in mode', (done) => {
      git.clean('x', (err: PotentialError) => {
         expect(err && err.message).toBe('Git clean mode parameter ("n" or "f") is required');
         expect([]).toEqual(childProcess.$lastCommandRun);
         done();
      });
      childProcess.$closeWith('');
   });

   it('unknown options', (done) => {
      git.clean('fa', (err: PotentialError) => {
         expect(err && err.message).toBe('Git clean unknown option found in "fa"');
         done();
      });
      childProcess.$closeWith('');
   });

   it('just show no directories', (done) => {
      git.clean('n', (err: PotentialError) => {
         expect(err).toBeNull();
         expect(['clean', '-n']).toEqual(childProcess.$lastCommandRun);
         done();
      });
      childProcess.$closeWith('');
   });

   it('just show', (done) => {
      git.clean('n', ['-d'], () => {
         expect(['clean', '-n', '-d']).toEqual(childProcess.$lastCommandRun);
         done();
      });
      childProcess.$closeWith('Would remove install.js');
   });

   it('force clean space', (done) => {
      git.clean('f', ['-d'], () => {
         expect(['clean', '-f', '-d']).toEqual(childProcess.$lastCommandRun);
         done();
      });
      childProcess.$closeWith('');
   });

   it('clean ignored files', (done) => {
      git.clean('f', ['-x', '-d'], (err: PotentialError) => {
         expect(['clean', '-f', '-x', '-d']).toEqual(childProcess.$lastCommandRun);
         done();
      });
      childProcess.$closeWith('');
   });

   it('prevents interactive mode - shorthand option', (done) => {
      git.clean('f', ['-i'], (err: PotentialError) => {
         expect(err).not.toBeNull();
         expect(childProcess.$callCount).toBe(0);

         done();
      });
      childProcess.$closeWith('');
   });

   it('prevents interactive mode - shorthand mode', (done) => {
      git.clean('fi', function (err: PotentialError) {
         expect(err).not.toBeNull();
         expect(childProcess.$callCount).toBe(0);

         done();
      });
      childProcess.$closeWith('');
   });

   it('prevents interactive mode - longhand option', (done) => {
      git.clean('f', ['--interactive'], (err: PotentialError) => {
         expect(err).not.toBeNull();
         expect(childProcess.$callCount).toBe(0);

         done();
      });
      childProcess.$closeWith('');
   });

});
