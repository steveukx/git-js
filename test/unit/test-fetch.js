import { newSimpleGit } from "./__fixtures__";

const jestify = require('../jestify');
const {closeWithSuccess, restore, theCommandRun} = require('./include/setup');
const FetchSummary = require('../../src/responses/FetchSummary');

var git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.push = {
   setUp: function (done) {
      git = newSimpleGit();
      done();
   },

   'runs escaped fetch' (test) {
      const branchPrefix = 'some-name';
      const ref = `'refs/heads/${branchPrefix}*:refs/remotes/origin/${branchPrefix}*'`;

      git.fetch(`origin`, ref, { '--depth': '2' }, () => {
         test.same(['fetch', '--depth=2', 'origin', ref], theCommandRun());
         test.done();

      });
      closeWithSuccess();
   },

   'git generates a fetch summary': function (test) {
      git.fetch('r', 'b', function (err, result) {
         test.ok(result instanceof FetchSummary);
         test.done();
      });
      closeWithSuccess();
   },

   'git fetch with remote and branch': function (test) {
      git.fetch('r', 'b', function (err, result) {
         test.same(['fetch', 'r', 'b'], theCommandRun());
         test.done();
      });
      closeWithSuccess();
   },

   'git fetch with no options': function (test) {
      git.fetch(function (err, result) {
         test.same(['fetch'], theCommandRun());
         test.done();
      });
      closeWithSuccess();
   },

   'git fetch with options': function (test) {
      git.fetch({'--all': null}, function (err, result) {
         test.same(['fetch', '--all'], theCommandRun());
         test.done();
      });
      closeWithSuccess();
   },

   'git fetch with array of options': function (test) {
      git.fetch(['--all', '-v'], function (err, result) {
         test.same(['fetch', '--all', '-v'], theCommandRun());
         test.done();
      });
      closeWithSuccess();
   },

   'parses new tags': function (test) {
      var summary = FetchSummary.parse(' * [new tag]         0.11.0     -> 0.11.0');

      test.same(summary.tags, [{ name: '0.11.0', tracking: '0.11.0' }]);
      test.done();
   },

   'parses new branches': function (test) {
      var summary = FetchSummary.parse(' * [new branch]         master     -> origin/master');

      test.same(summary.branches, [{ name: 'master', tracking: 'origin/master' }]);
      test.done();
   },

   'parses remote': function (test) {
      var summary = FetchSummary.parse('From https://github.com/steveukx/git-js');

      test.same(summary.remote, 'https://github.com/steveukx/git-js');
      test.done();
   }
};

jestify(exports);
