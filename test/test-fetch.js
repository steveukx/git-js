'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');

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
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'git generates a fetch summary': function (test) {
      git.fetch('r', 'b', function (err, result) {
         test.ok(result instanceof require('../src/FetchSummary'));
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with remote and branch': function (test) {
      git.fetch('r', 'b', function (err, result) {
         test.same(['fetch', 'r', 'b'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with no options': function (test) {
      git.fetch(function (err, result) {
         test.same(['fetch'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with options': function (test) {
      git.fetch({'--all': null}, function (err, result) {
         test.same(['fetch', '--all'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git fetch with array of options': function (test) {
      git.fetch(['--all', '-v'], function (err, result) {
         test.same(['fetch', '--all', '-v'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'parses new tags': function (test) {
      var parser = require('../src/FetchSummary');
      var summary = parser.parse(' * [new tag]         0.11.0     -> 0.11.0');

      test.same(summary.tags, [{ name: '0.11.0', tracking: '0.11.0' }]);
      test.done();
   },

   'parses new branches': function (test) {
      var parser = require('../src/FetchSummary');
      var summary = parser.parse(' * [new branch]         master     -> origin/master');

      test.same(summary.branches, [{ name: 'master', tracking: 'origin/master' }]);
      test.done();
   },

   'parses remote': function (test) {
      var parser = require('../src/FetchSummary');
      var summary = parser.parse('From https://github.com/steveukx/git-js');

      test.same(summary.remote, 'https://github.com/steveukx/git-js');
      test.done();
   }
};
