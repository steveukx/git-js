'use strict';

var setup = require('./include/setup');
var sinon = require('sinon');
var FetchSummary = require('../../src/responses/FetchSummary');

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

   'git generates a fetch summary': function gitGeneratesAFetchSummary(test) {
      git.fetch('r', 'b', function (err, result) {
         test.ok(result instanceof FetchSummary);
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with remote and branch': function gitFetchWithRemoteAndBranch(test) {
      git.fetch('r', 'b', function (err, result) {
         test.same(['fetch', 'r', 'b'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with no options': function gitFetchWithNoOptions(test) {
      git.fetch(function (err, result) {
         test.same(['fetch'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with options': function gitFetchWithOptions(test) {
      git.fetch({ '--all': null }, function (err, result) {
         test.same(['fetch', '--all'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with array of options': function gitFetchWithArrayOfOptions(test) {
      git.fetch(['--all', '-v'], function (err, result) {
         test.same(['fetch', '--all', '-v'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'parses new tags': function parsesNewTags(test) {
      var summary = FetchSummary.parse(' * [new tag]         0.11.0     -> 0.11.0');

      test.same(summary.tags, [{ name: '0.11.0', tracking: '0.11.0' }]);
      test.done();
   },

   'parses new branches': function parsesNewBranches(test) {
      var summary = FetchSummary.parse(' * [new branch]         master     -> origin/master');

      test.same(summary.branches, [{ name: 'master', tracking: 'origin/master' }]);
      test.done();
   },

   'parses remote': function parsesRemote(test) {
      var summary = FetchSummary.parse('From https://github.com/steveukx/git-js');

      test.same(summary.remote, 'https://github.com/steveukx/git-js');
      test.done();
   }
};