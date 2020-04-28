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

exports.init = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'with just a handler': function (test) {
      git.init(function (err) {
         test.equals(null, err, 'not an error');
         test.same(["init"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'as a bare repo': function (test) {
      git.init(true, function (err) {
         test.equals(null, err, 'not an error');
         test.same(["init", "--bare"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'as a regular repo': function (test) {
      git.init('truthy value', function (err) {
         test.equals(null, err, 'not an error');
         test.same(["init"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'no handler': function (test) {
      git.init();
      closeWith('');

      setTimeout(function () {
         test.same(["init"], theCommandRun());
         test.done();
      });
   }
};

jestify(exports);
