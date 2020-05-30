
const {restore, Instance, childProcessEmits} = require('./include/setup');
const sinon = require('sinon');

describe('git', () => {

   let git, sandbox;

   beforeEach(() => {
      restore();
      sandbox = sinon.createSandbox();
   });

   afterEach(() => restore(sandbox));

   describe('simpleGit', () => {

      const simpleGit = require('../..');

      it('throws when created with a non-existent directory', () => {
         expect(() => simpleGit('/tmp/foo-bar-baz')).toThrow();
      });

      it('works with valid directories', () => {
         expect(() => simpleGit(__dirname)).not.toThrow();
      });

   });

   it('caters for close event with no exit', () => new Promise(done => {
      git = Instance();
      git.init(() => done());

      childProcessEmits('close', 'some data', 0);
   }));

   it('caters for exit with no close', () => new Promise(done => {
      git = Instance();
      git.init(() => done());

      childProcessEmits('exit', 'some data', 0);
   }));

   it('caters for close and exit', async () => {
      let handler = sandbox.spy();

      git = Instance();
      git.init(handler);

      await childProcessEmits('close', 'some data', 0);
      await childProcessEmits('exit', 'some data', 0);

      expect(handler.calledOnce).toBe(true);
   });

});
