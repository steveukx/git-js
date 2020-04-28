
const jestify = require('../jestify');
const setup = require('./include/setup');
const sinon = require('sinon');

var git, sandbox;

exports.setUp = function (done) {
   setup.restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   setup.restore();
   sandbox.restore();
   done();
};

exports.stash = {
   setUp: function(done) {
      git = setup.Instance();
      done();
   },

   'stash working directory': function(test) {
      git.stash(function (err, result) {
         test.same(["stash"], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('');
   },

   'stash pop': function(test) {
      git.stash(["pop"], function (err, result) {
         test.same(["stash", "pop"], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('');
   },

   'stash with options no handler': function(test) {
      git.stash(["branch", "some-branch"]);
      setup.closeWith('');

      setTimeout(() => {
         test.same(["stash", "branch", "some-branch"], setup.theCommandRun());
         test.done();
      });

   }
};

jestify(exports);
