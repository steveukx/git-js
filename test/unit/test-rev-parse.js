
const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, instanceP, restore, wait} = require('./include/setup');
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

exports.revParseP = {

   setUp (done) {
      git = instanceP(sandbox);
      done();
   },

   'returns rev-parse data to a promise' (test) {

      git.revparse(['--show-toplevel'])
         .then(topLevel => {
            test.same(topLevel, '/var/tmp/some-root');
            test.done();
         });

      setTimeout(() => closeWith('   /var/tmp/some-root   '), 10);
   },

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

   async 'called with a string' (test) {
      git.revparse('some string');
      await wait();

      test.same(["rev-parse", "some", "string"], theCommandRun());
      test.done();
   },

   async 'called with an array of strings' (test) {
      git.revparse(['another', 'string']);
      await wait();

      test.same(["rev-parse", "another", "string"], theCommandRun());
      test.done();

   },

};

jestify(exports);
