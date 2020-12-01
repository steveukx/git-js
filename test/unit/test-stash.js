import { newSimpleGit } from "./__fixtures__";

const jestify = require('../jestify');
const {closeWithSuccess, restore, theCommandRun} = require('./include/setup');

var git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.stash = {
   setUp: function(done) {
      git = newSimpleGit();
      done();
   },

   'stash working directory': function(test) {
      git.stash(function (err, result) {
         test.same(["stash"], theCommandRun());

         test.done();
      });

      closeWithSuccess();
   },

   'stash pop': function(test) {
      git.stash(["pop"], function (err, result) {
         test.same(["stash", "pop"], theCommandRun());

         test.done();
      });

      closeWithSuccess();
   },

   'stash with options no handler': function(test) {
      git.stash(["branch", "some-branch"]);
      closeWithSuccess();

      setTimeout(() => {
         test.same(["stash", "branch", "some-branch"], theCommandRun());
         test.done();
      });

   }
};

jestify(exports);
