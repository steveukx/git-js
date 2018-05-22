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

exports.revert = {
   setUp: function setUp(done) {
      git = setup.Instance();
      done();
   },

   'reverts': function reverts(test) {
      git.revert('HEAD~3', function (err, data) {
         test.equals(err, null);
         test.same(['revert', 'HEAD~3'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('some data');
   },

   'reverts a range': function revertsARange(test) {
      git.revert('master~5..master~2', { '-n': null }, function (err, data) {
         test.equals(err, null);
         test.same(['revert', '-n', 'master~5..master~2'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('some data');
   },

   'requires a string': function requiresAString(test) {
      git.revert(function (err, data) {
         test.ok(err instanceof TypeError);
         test.same([], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('some data');
   }
};