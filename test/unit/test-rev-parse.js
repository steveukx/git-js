
const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   sandbox.stub(console, 'warn');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.revParse = {

   setUp (done) {
      git = Instance();
      done();
   },

   'deprecated usage' (test) {
      git.revparse('HEAD', (err, revision) => {
         test.same(null, err);
         test.same('', revision);
         test.ok(console.warn.calledOnce, 'should log a warning for deprecated usage');

         test.done();
      });

      closeWith('');
   },

   'valid usage' (test) {
      git.revparse(['HEAD'], (err, revision) => {
         test.same(null, err);
         test.same('', revision);
         test.ok(console.warn.notCalled, 'should not log a warning for valid usage');

         test.done();
      });

      closeWith('');
   },

   'called with a string' (test) {
      git.revparse('some string');
      test.same(
         ["rev-parse", "some", "string"],
         theCommandRun());
      test.done();
   },

   'called with an array of strings' (test) {
      git.revparse(['another', 'string']);
      test.same(
         ["rev-parse", "another", "string"],
         theCommandRun());
      test.done();
   }

};
