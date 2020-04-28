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

exports.reset = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   hard: function (test) {
      git.reset('hard', function (err) {
         test.equals(null, err, 'not an error');
         test.same(
            ["reset", "--hard"],
            theCommandRun());
         test.done();
      });

      closeWith('');
   },

   soft: function (test) {
      git.reset('soft', function (err) {
         test.equals(null, err, 'not an error');
         test.same(
            ["reset", "--soft"],
            theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'reset hard to commit': function (test) {
      git.reset(['commit-ish', '--hard'], function (err) {
         test.equals(null, err, 'not an error');
         test.same(
            ["reset", "commit-ish", "--hard"],
            theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'reset hard to commit with no handler': function (test) {
      git.reset(['commit-ish', '--hard']);

      closeWith('');
      setTimeout(function () {
         test.same(["reset", "commit-ish", "--hard"], theCommandRun());
         test.done();
      });
   },

   'no handler': function (test) {
      git.reset();
      closeWith('');

      setTimeout(function () {
         test.same(["reset", "--soft"], theCommandRun());
         test.done();
      });
   }
};

jestify(exports);

