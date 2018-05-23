'use strict';

var setup = require('./include/setup');
var sinon = require('sinon');

var git, sandbox;

exports.setUp = function (done) {
   setup.restore();
   sandbox = sinon.sandbox.create();
   done();
};

exports.tearDown = function (done) {
   setup.restore();
   sandbox.restore();
   done();
};

exports.stash = {
   setUp: function setUp(done) {
      git = setup.Instance();
      done();
   },

   'stash working directory': function stashWorkingDirectory(test) {
      git.stash(function (err, result) {
         test.same(['stash'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('');
   },

   'stash pop': function stashPop(test) {
      git.stash(['pop'], function (err, result) {
         test.same(['stash', 'pop'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('');
   },

   'stash with options no handler': function stashWithOptionsNoHandler(test) {
      git.stash(['branch', 'some-branch']);
      setup.closeWith('');

      test.same(['stash', 'branch', 'some-branch'], setup.theCommandRun());
      test.done();
   }
};