
const jestify = require('../jestify');
const {theCommandRun, closeWith, errorWith, hasQueuedTasks, Instance, restore} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   sandbox.stub(console, 'error');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.remotes = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'list remotes when there are none set up' (test) {
      git.getRemotes((err, result) => {
         test.same(null, err);
         test.same([], result);

         test.done();
      });

      closeWith('');
   },

   'get list': function (test) {
      git.getRemotes(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["remote"], theCommandRun());
         test.same([
            {name: 'origin', refs: {}},
            {name: 'upstream', refs: {}}
         ], result, 'parses response');
         test.done();
      });

      closeWith('\
        origin\n\
        upstream');
   },

   'get verbose list': function (test) {
      git.getRemotes(true, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["remote", "-v"], theCommandRun());
         test.same([
            {name: 'origin', refs: {fetch: 's://u@d.com/u/repo.git', push: 's://u@d.com/u/repo.git'}},
            {name: 'upstream', refs: {fetch: 's://u@d.com/another/repo.git', push: 's://u@d.com/another/repo.git'}}
         ], result, 'parses response');
         test.done();
      });

      closeWith('\
        origin    s://u@d.com/u/repo.git (fetch)\n\
        origin    s://u@d.com/u/repo.git (push)\n\
        upstream  s://u@d.com/another/repo.git (fetch)\n\
        upstream  s://u@d.com/another/repo.git (push)\n\
        ');
   },

   'Does not throw when there is no supplied function': function (test) {
      git.getRemotes(true);

      test.doesNotThrow(function () {
         closeWith('\
            origin    s://u@d.com/u/repo.git (fetch)\n\
            origin    s://u@d.com/u/repo.git (push)\n\
            upstream  s://u@d.com/another/repo.git (fetch)\n\
            upstream  s://u@d.com/another/repo.git (push)\n\
            ');
      });

      test.done();
   }
};

jestify(exports);
