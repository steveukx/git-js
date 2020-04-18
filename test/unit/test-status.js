
const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');
const sinon = require('sinon');
const StatusSummary = require('../../src/responses/StatusSummary');

let git, sandbox;

describe('status', () => {

   const test = {
      deepEqual: function (actual, expected) {
         expect(actual).toEqual(expected);
      },
      equal: function (actual, expected) {
         expect(actual).toEqual(expected);
      },
      equals: function (actual, expected) {
         expect(actual).toBe(expected);
      },
      notEqual: function (actual, expected) {
         expect(actual).not.toEqual(expected);
      },
      ok: function (actual) {
         expect(actual).toBeTruthy();
      },
      same: function (actual, expected) {
         expect(actual).toEqual(expected);
      },
      doesNotThrow: function (thrower) {
         expect(thrower).not.toThrow();
      },
      throws: function (thrower) {
         expect(thrower).toThrow();
      },
   };

   beforeEach(() => {
      restore();
      sandbox = sinon.createSandbox();
      git = Instance();
   });

   afterEach(() => {
      restore(sandbox);
   });

   it('Complex status - renamed, new and un-tracked modifications', () => {
      const statusSummary = StatusSummary.parse(`
## master
 M other.txt
A  src/b.txt
R  src/a.txt -> src/c.txt
`);

      test.deepEqual(statusSummary.created, ['src/b.txt']);
      test.deepEqual(statusSummary.modified, ['other.txt']);
      test.deepEqual(statusSummary.renamed, [{from: 'src/a.txt', to: 'src/c.txt'}]);

   });

   it('Handles renamed', () => {
      var statusSummary;

      statusSummary = StatusSummary.parse(' R  src/file.js -> src/another-file.js');
      test.equals(statusSummary.renamed.length, 1);
      test.same(statusSummary.renamed[0], {from: 'src/file.js', to: 'src/another-file.js'});
   });

   it('uses branch detail and returns a StatusSummary', () => new Promise(done => {
      git.status(function (err, status) {
         test.same(['status', '--porcelain', '-b', '-u'], theCommandRun());
         test.ok(status instanceof StatusSummary);
         done();
      });

      closeWith('');
   }));

   it('parses status', () => {
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
   });

   it('reports on clean branch', () => {
      ['M', 'AM', 'UU', 'D'].forEach(function (type) {
         test.same(StatusSummary.parse(type + ' file-name.foo').isClean(), false);
      });
      test.same(StatusSummary.parse('\n').isClean(), true);

   });

   it('empty status', () => new Promise(done => {
      git.status(function (err, status) {
         test.deepEqual(status.created, []);
         test.deepEqual(status.deleted, []);
         test.deepEqual(status.modified, []);
         test.deepEqual(status.not_added, []);
         test.deepEqual(status.conflicted, []);
         done();
      });

      closeWith('');
   }));

   it('staged modified files identified separately to other modified files', () => {
      const summary = StatusSummary.parse(`
            ## master
             M aaa
            M  bbb
            A  ccc
            ?? ddd
      `);

      test.deepEqual(summary.staged, ['bbb']);
      test.deepEqual(summary.modified, ['aaa', 'bbb']);
   });

   it('staged modified file with modifications after staging', () => {
      const summary = StatusSummary.parse(`
            ## master
            MM staged-modified
             M modified
            M  staged
      `);

      test.deepEqual(summary.staged, ['staged-modified', 'staged']);
      test.deepEqual(summary.modified, ['staged-modified', 'modified', 'staged']);
   });

   it('modified status', () => {
      const summary = StatusSummary.parse(`
             M package.json
            M  src/git.js
            AM src/index.js
             A src/newfile.js
            AM test.js
            ?? test
            UU test.js
      `);

      test.deepEqual(summary.created, ['src/index.js', 'src/newfile.js', 'test.js'], 'New files');
      test.deepEqual(summary.deleted, [], 'No removed files');
      test.deepEqual(summary.modified, ['package.json', 'src/git.js'], 'Files Modified');
      test.deepEqual(summary.not_added, ['test'], 'Files not added');
      test.deepEqual(summary.conflicted, ['test.js'], 'Files in conflict');
      test.deepEqual(summary.staged, ['src/git.js'], 'Modified files staged');
   });

   it('index/wd status', () => new Promise(done => {
      git.status(function (err, status) {
         test.same(status.files, [
            {path: 'src/git_wd.js', index: ' ', working_dir: 'M'},
            {path: 'src/git_ind_wd.js', index: 'M', working_dir: 'M'},
            {path: 'src/git_ind.js', index: 'M', working_dir: ' '}
         ]);

         done();
      });

      closeWith(' M src/git_wd.js\n\
MM src/git_ind_wd.js\n\
M  src/git_ind.js\n');
   }));

   it('Report conflict when both sides have added the same file', () => {
      const statusSummary = StatusSummary.parse(`## master\nAA filename`);
      test.deepEqual(statusSummary.conflicted, ['filename']);
   });

   it('Report all types of merge conflict statuses', () => {
      const summary = StatusSummary.parse(`
            UU package.json
            DD src/git.js
            DU src/index.js
            UD src/newfile.js
            AU test.js
            UA test
            AA test-foo.js
      `);

      test.deepEqual(summary.conflicted, ['package.json', 'src/git.js', 'src/index.js', 'src/newfile.js', 'test.js', 'test', 'test-foo.js'], 'Files in conflict');
   });
});

