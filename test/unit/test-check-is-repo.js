'use strict';

var _require = require('./include/setup'),
    theCommandRun = _require.theCommandRun,
    closeWith = _require.closeWith,
    errorWith = _require.errorWith,
    hasQueuedTasks = _require.hasQueuedTasks,
    Instance = _require.Instance,
    restore = _require.restore;

var sinon = require('sinon');

var git = void 0,
    sandbox = void 0;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.sandbox.create();
   sandbox.stub(console, 'error');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.checkIsRepo = {
   setUp: function setUp(done) {
      git = Instance();
      done();
   },

   'when is a part of a git repo': function whenIsAPartOfAGitRepo(test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(['rev-parse', '--is-inside-work-tree'], theCommandRun());
         test.same(null, err);
         test.same(isRepo, true);

         test.ok(console.error.notCalled, 'generates no error');
         test.done();
      });

      closeWith(' true ');
   },

   'when is not part of a git repo': function whenIsNotPartOfAGitRepo(test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(null, err);
         test.same(isRepo, false);

         test.ok(console.error.notCalled, 'generates no error');
         test.done();
      });

      errorWith(' Not a git repository ');
      closeWith(128);
   },

   'when there is some other non-clean shutdown': function whenThereIsSomeOtherNonCleanShutdown(test) {
      var errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(function (err, isRepo) {
         test.same(errorString, err);

         test.ok(console.error.called, 'generates an error');
         test.done();
      });

      errorWith(errorString);
      closeWith(128);
   },

   'when there is some other error': function whenThereIsSomeOtherError(test) {
      var errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(function (err, isRepo) {
         test.same(errorString, err);

         test.ok(console.error.called, 'generates an error');
         test.done();
      });

      errorWith(errorString);
      closeWith(-1);
   },

   'does not kill the queue when an expected error occurs': function doesNotKillTheQueueWhenAnExpectedErrorOccurs(test) {
      git.checkIsRepo(function () {
         test.equals(hasQueuedTasks(), true);
         test.done();
      });
      git.init();

      errorWith('Not a git repository');
      closeWith(128);
   },

   'kills the queue when an unexpected error occurs': function killsTheQueueWhenAnUnexpectedErrorOccurs(test) {
      git.checkIsRepo(function () {
         test.equals(hasQueuedTasks(), false);
         test.done();
      });
      git.init();

      errorWith('blah');
      closeWith(-1);
   }
};