const {Instance, restore, closeWithSuccess, theCommandRun, theCommandsRun} = require('./include/setup');
const {TaskConfigurationError} = require('../../src/lib/api');

describe('revert', () => {

   let git;

   beforeEach(() => {
      git = Instance();
   });

   afterEach(() => restore());

   it('reverts', () => new Promise(done => {
      git.revert('HEAD~3', err => {
         expect(err).toBeNull();
         expect(theCommandRun()).toEqual(['revert', 'HEAD~3']);

         done();
      });

      closeWithSuccess('some data');
   }));

   it('reverts a range', () => new Promise(done => {
      git.revert('master~5..master~2', {'-n': null}, err => {
         expect(err).toBeNull();
         expect(theCommandRun()).toEqual(['revert', '-n', 'master~5..master~2']);

         done();
      });

      closeWithSuccess('some data');
   }));

   it('requires a string', () => new Promise(done => {
      git.revert(err => {
         expect(err).toBeInstanceOf(TaskConfigurationError);
         expect(theCommandsRun()).toHaveLength(0);

         done();
      });

      closeWithSuccess('some data');
   }));

});
