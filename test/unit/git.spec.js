const {createSandbox} = require('sinon');
const {restore, Instance, childProcessEmits, closeWithSuccess, wait} = require('./include/setup');
const {autoMergeResponse, autoMergeConflict} = require('../helpers');
const {GitResponseError} = require('../../src/lib/api');

describe('git', () => {

   let git, sandbox;

   beforeEach(() => {
      (sandbox = createSandbox()).stub(console, 'warn');
   });

   afterEach(() => restore(sandbox));

   describe('deprecations', () => {

      it('direct access to properties of custom error on GitResponseError', async () => {
         let callbackErr, promiseErr;

         git = Instance();
         git.merge(['a', 'b'], (err) => callbackErr = err)
            .catch(err => promiseErr = err);

         await closeWithSuccess(
            autoMergeResponse(autoMergeConflict)
         );
         await wait();

         expect(callbackErr).toBeInstanceOf(GitResponseError);
         expect(promiseErr).toBeInstanceOf(GitResponseError);
         expect(callbackErr).not.toBe(promiseErr);

         const warning = jest.spyOn(console, 'warn');

         // accessing properties on the callback error shows a warning
         const conflicts = callbackErr.conflicts;
         expect(warning).toHaveBeenCalledTimes(1);

         // but gives a pointer to the real value
         expect(conflicts).toBe(promiseErr.git.conflicts);

         // subsequent access of properties
         expect(callbackErr.merges).toBe(promiseErr.git.merges);

         // do not show additional warnings in the console
         expect(warning).toHaveBeenCalledTimes(1);

         // the promise error has not been modified with the properties of the response
         expect('conflicts' in promiseErr).toBe(false);
      });

   });

   describe('simpleGit', () => {

      const simpleGit = require('../..');
      const { $fails, $reset } = require('@kwsites/file-exists');

      afterEach(() => $reset());

      it('throws when created with a non-existent directory', () => {
         $fails();
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
