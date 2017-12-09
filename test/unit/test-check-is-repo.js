'use strict';

const sinon = require('sinon');

var git, sandbox;
var {theCommandRun, closeWith, errorWith, hasQueuedTasks, Instance, restore} = require('./include/setup');

exports.setUp = function (done) {
   restore();
   sandbox = sinon.sandbox.create();
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

   'when is a part of a git repo': function (test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(['rev-parse', '--is-inside-work-tree'], theCommandRun());
         test.same(null, err);
         test.same(isRepo, true);

         test.done();
      });

      closeWith(` true `);
   },

   'when is not part of a git repo': function (test) {
      git.checkIsRepo(function (err, isRepo) {
         test.same(null, err);
         test.same(isRepo, false);

         test.done();
      });

      errorWith(` Not a git repository `);
      closeWith(128);
   },

   'when there is some other non-clean shutdown': function (test) {
      const errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(function (err, isRepo) {
         test.same(errorString, err);

         test.done();
      });

      errorWith(errorString);
      closeWith(128);
   },

   'when there is some other error': function (test) {
      const errorString = 'Some other non-clean shutdown message';
      git.checkIsRepo(function (err, isRepo) {
         test.same(errorString, err);

         test.done();
      });

      errorWith(errorString);
      closeWith(-1);
   },

   'does not kill the queue when an expected error occurs': function (test) {
      git.checkIsRepo(() => {
         test.equals(hasQueuedTasks(), true);
         test.done();
      });
      git.init();

      errorWith('Not a git repository');
      closeWith(128);

   },

   'kills the queue when an unexpected error occurs': function (test) {
      git.checkIsRepo(() => {
         test.equals(hasQueuedTasks(), false);
         test.done();
      });
      git.init();

      errorWith('blah');
      closeWith(-1);

   }
};
