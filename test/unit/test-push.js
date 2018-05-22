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

exports.push = {
   setUp: function setUp(done) {
      git = setup.Instance();
      done();
   },

   'git push can set multiple options': function gitPushCanSetMultipleOptions(test) {
      git.push(['foo', 'bar'], function (err, result) {
         test.same(['push', 'foo', 'bar'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push can set branch and remote': function gitPushCanSetBranchAndRemote(test) {
      git.push('rrr', 'bbb', function (err, result) {
         test.same(['push', 'rrr', 'bbb'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push can run with no arguments': function gitPushCanRunWithNoArguments(test) {
      git.push(function (err, result) {
         test.same(['push'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push with options': function gitPushWithOptions(test) {
      git.push({ '--follow-tags': null }, function (err, result) {
         test.same(['push', '--follow-tags'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push with remote/branch and options': function gitPushWithRemoteBranchAndOptions(test) {
      git.push('rrr', 'bbb', { '--follow-tags': null }, function (err, result) {
         test.same(['push', 'rrr', 'bbb', '--follow-tags'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   }
};