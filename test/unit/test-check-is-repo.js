
const jestify = require('../jestify');
const {theCommandRun, closeWith, errorWith, hasQueuedTasks, Instance, restore} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.checkIsRepo = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'when is a part of a bare git repo' (test) {
      git.checkIsRepo(true, function (err, isRepo) {
         test.same(['rev-parse', '--is-bare-repository'], theCommandRun());
         test.same(null, err);
         test.same(isRepo, true);

         test.done();
      });

      closeWith(` true `);
   },

   'when is a part of a git repo' (test) {
      git.checkIsRepo(false, function (err, isRepo) {
         test.same(['rev-parse', '--is-inside-work-tree'], theCommandRun());
         test.same(null, err);
         test.same(isRepo, true);

         test.done();
      });

      closeWith(` true `);
   },

   'when is not part of a git repo' (test) {
      git.checkIsRepo(false, function (err, isRepo) {
         test.same(null, err);
         test.same(isRepo, false);

         test.done();
      });

      errorWith(` Not a git repository `);
      closeWith(128);
   },

   'when is not part of a German locale git repo' (test) {
      git.checkIsRepo(false, function (err, isRepo) {
         test.same(null, err);
         test.same(isRepo, false);

         test.done();
      });

      errorWith(` Kein Git-Repository `);
      closeWith(128);
   },

   'when there is some other non-clean shutdown' (test) {
      const errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(false, function (err) {
         test.same(errorString, err.message);

         test.done();
      });

      errorWith(errorString);
      closeWith(128);
   },

   'when there is some other error' (test) {
      const errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(false, function (err, isRepo) {
         test.same(errorString, err.message);

         test.done();
      });

      errorWith(errorString);
      closeWith(-1);
   },

};

jestify(exports);
