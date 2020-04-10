
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

exports.checkIsRepo = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'when is a part of a git repo' (test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(['rev-parse', '--is-inside-work-tree'], theCommandRun());
         test.same(null, err);
         test.same(isRepo, true);

         test.ok(console.error.notCalled, 'generates no error');
         test.done();
      });

      closeWith(` true `);
   },

   'when is not part of a git repo' (test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(null, err);
         test.same(isRepo, false);

         test.ok(console.error.notCalled, 'generates no error');
         test.done();
      });

      errorWith(` Not a git repository `);
      closeWith(128);
   },

   'when is not part of a German locale git repo' (test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(null, err);
         test.same(isRepo, false);

         test.ok(console.error.notCalled, 'generates no error');
         test.done();
      });

      errorWith(` Kein Git-Repository `);
      closeWith(128);
   },

   'when there is some other non-clean shutdown' (test) {
      const errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(function (err, isRepo) {
         test.same(errorString, err);

         test.ok(console.error.called, 'generates an error');
         test.done();
      });

      errorWith(errorString);
      closeWith(128);
   },

   'when there is some other error' (test) {
      const errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(function (err, isRepo) {
         test.same(errorString, err);

         test.ok(console.error.called, 'generates an error');
         test.done();
      });

      errorWith(errorString);
      closeWith(-1);
   },

   'does not kill the queue when an expected error occurs' (test) {
      git.checkIsRepo(() => {
         test.equals(hasQueuedTasks(), true);
         test.done();
      });
      git.init();

      errorWith('Not a git repository');
      closeWith(128);

   },

   'does not kill the queue when an expected error occurs irrespective of case' (test) {
      git.checkIsRepo(() => {
         test.equals(hasQueuedTasks(), true);
         test.done();
      });
      git.init();

      errorWith('NOT a GIT repository');
      closeWith(128);

   },

   'kills the queue when an unexpected error occurs' (test) {
      git.checkIsRepo(() => {
         test.equals(hasQueuedTasks(), false);
         test.done();
      });
      git.init();

      errorWith('blah');
      closeWith(-1);

   }
};

jestify(exports);
