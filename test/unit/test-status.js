'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');
const StatusSummary = require('../../src/responses/StatusSummary');

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

exports.status = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'Handles renamed': function (test) {
      var statusSummary;

      statusSummary = StatusSummary.parse(' R  src/file.js -> src/another-file.js');
      test.equals(statusSummary.renamed.length, 1);
      test.same(statusSummary.renamed[0], { from: 'src/file.js', to: 'src/another-file.js'} );

      test.done();
   },

   'uses branch detail and returns a StatusSummary': function (test) {
      git.status(function (err, status) {
         test.same(["status", "--porcelain", "-b"], setup.theCommandRun());
         test.ok(status instanceof StatusSummary);
         test.done();
      });

      setup.closeWith('');
   },

   'parses status': function (test) {
      var statusSummary;

      statusSummary = StatusSummary.parse('## master...origin/master [ahead 3]');
      test.equals(statusSummary.current, 'master');
      test.equals(statusSummary.tracking, 'origin/master');
      test.equals(statusSummary.ahead, 3);
      test.equals(statusSummary.behind, 0);

      statusSummary = StatusSummary.parse('## release/0.34.0...origin/release/0.34.0');
      test.equals(statusSummary.current, 'release/0.34.0');
      test.equals(statusSummary.tracking, 'origin/release/0.34.0');
      test.equals(statusSummary.ahead, 0);
      test.equals(statusSummary.behind, 0);

      statusSummary = StatusSummary.parse('## HEAD (no branch)');
      test.equals(statusSummary.current, 'HEAD');
      test.equals(statusSummary.tracking, null);
      test.equals(statusSummary.ahead, 0);
      test.equals(statusSummary.behind, 0);

      statusSummary = StatusSummary.parse('?? Not tracked File\nUU Conflicted\n D Removed');
      test.same(statusSummary.not_added, ['Not tracked File']);
      test.same(statusSummary.conflicted, ['Conflicted']);
      test.same(statusSummary.deleted, ['Removed']);

      statusSummary = StatusSummary.parse(' M Modified\n A Added\nAM Changed');
      test.same(statusSummary.modified, ['Modified']);
      test.same(statusSummary.created, ['Added', 'Changed']);

      statusSummary = StatusSummary.parse('## this_branch');
      test.equals(statusSummary.current, 'this_branch');
      test.equals(statusSummary.tracking, null);

      test.done();
   },

   'reports on clean branch': function (test) {
      ['M', 'AM', 'UU', 'D'].forEach(function (type) {
         test.same(StatusSummary.parse(type + ' file-name.foo').isClean(), false);
      });
      test.same(StatusSummary.parse('\n').isClean(), true);

      test.done();
   },

   'empty status': function (test) {
      git.status(function (err, status) {
         test.equals(0, status.created,      'No new files');
         test.equals(0, status.deleted,      'No removed files');
         test.equals(0, status.modified,     'No modified files');
         test.equals(0, status.not_added,    'No untracked files');
         test.equals(0, status.conflicted,   'No conflicted files');
         test.done();
      });

      setup.closeWith('');
   },

   'modified status': function (test) {
      git.status(function (err, status) {
         test.equals(3, status.created.length,      'No new files');
         test.equals(0, status.deleted.length,      'No removed files');
         test.equals(2, status.modified.length,     'No modified files');
         test.equals(1, status.not_added.length,    'No un-tracked files');
         test.equals(1, status.conflicted.length,   'No conflicted files');
         test.done();
      });

      setup.closeWith(' M package.json\n\
        M src/git.js\n\
        AM src/index.js \n\
        A src/newfile.js \n\
        AM test.js\n\
        ?? test/ \n\
        UU test.js\n\
        ');
   },

   'index/wd status': function (test) {
      git.status(function (err, status) {
         test.same(status.files, [
           {path: 'src/git_wd.js', index: ' ', working_dir: 'M'},
           {path: 'src/git_ind_wd.js', index: 'M', working_dir: 'M'},
           {path: 'src/git_ind.js', index: 'M', working_dir: ' '}
         ]);

         test.done();
      });

      setup.closeWith(' M src/git_wd.js\n\
MM src/git_ind_wd.js\n\
M  src/git_ind.js\n');
   }
};
