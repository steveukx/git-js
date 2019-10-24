import dependencies from '../../src/util/dependencies';
import { MockBuffer } from './include/mock-buffer';
import { PotentialError, SimpleGit, simpleGitBuilder } from '../../src';
import { MockChildProcess } from './include/mock-child-process';
import { SinonSandbox, createSandbox } from 'sinon';
import expect = require('expect');

describe('clone', () => {

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

   it('clone with repo and local', (done) => {
      git.clone('repo', 'lcl', (err: PotentialError, data: string) => {
         expect(['clone', 'repo', 'lcl']).toEqual(childProcess.$lastCommandRun);
         expect('anything').toBe(data);
         expect(err).toBeNull();

         done();
      });

      childProcess.$closeWith('anything');
   });

   it('clone with just repo', (done) => {
      git.clone('proto://remote.com/repo.git', (err: PotentialError) => {
         expect(['clone', 'proto://remote.com/repo.git']).toEqual(childProcess.$lastCommandRun);
         expect(err).toBeNull();

         done();
      });

      childProcess.$closeWith('anything');
   });

   it('clone with options', (done) => {
      git.clone('repo', 'lcl', ['foo', 'bar'], () => {
         expect(['clone', 'foo', 'bar', 'repo', 'lcl']).toEqual(childProcess.$lastCommandRun);
         done();
      });

      childProcess.$closeWith('anything');
   });

   it('clone with array of options without local', (done) => {
      git.clone('repo', ['foo', 'bar'], () => {
         expect(['clone', 'foo', 'bar', 'repo']).toEqual(childProcess.$lastCommandRun);
         done();
      });

      childProcess.$closeWith('anything');
   });

   it('explicit mirror', (done) => {
      git.mirror('r', 'l', () => {
         expect(['clone', '--mirror', 'r', 'l']).toEqual(childProcess.$lastCommandRun);
         done();
      });

      childProcess.$closeWith();
   });

});
