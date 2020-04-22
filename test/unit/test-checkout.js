const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, restore, MockChildProcess} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore(sandbox);
   done();
};

exports.checkout = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'simple checkout': function (test) {
      git.checkout('something', function (err, result) {
         test.equals(null, err);
         test.same(['checkout', 'something'], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'checkoutBranch': function (test) {
      git.checkoutBranch('branch', 'start', function (err, result) {
         test.equals(null, err);
         test.same(['checkout', '-b', 'branch', 'start'], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'checkoutLocalBranch': function (test) {
      git.checkoutLocalBranch('new-branch', function (err, result) {
         test.equals(null, err);
         test.same(['checkout', '-b', 'new-branch'], theCommandRun());
         test.done();
      });

      closeWith('');
   }
};

jestify(exports);
