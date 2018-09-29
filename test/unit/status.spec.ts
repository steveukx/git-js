import { StatusSummary } from '../../src/responses/status-summary';
import { SimpleGit } from '../../src';
import { Runner } from '../../src/interfaces/command-runner';
import { setup, test, TestHelper } from './include/util';

describe('StatusSummary', () => {

   let helper: TestHelper;
   let git: SimpleGit;
   let runner: Runner;

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('Handles renamed', () => {
      const statusSummary = StatusSummary.parse(` R  src/file.js -> src/another-file.js`);
      expect(statusSummary.renamed.length).toBe(1);
      expect(statusSummary.renamed[0]).toEqual({ from: 'src/file.js', to: 'src/another-file.js'} );

   });

   it('uses branch detail and returns a StatusSummary', (done) => {
      git.status(function (err: Error, status: StatusSummary) {
         test.same(['status', '--porcelain', '-b', '-u'], helper.theCommandRun());
         test.ok(status instanceof StatusSummary);
         done();
      });

      helper.closeWith('');
   });


   it('parses status', (done) => {
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

      done();
   });

   it('reports on clean branch', (done) => {
      ['M', 'AM', 'UU', 'D'].forEach(function (type) {
         test.same(StatusSummary.parse(type + ' file-name.foo').isClean(), false);
      });
      test.same(StatusSummary.parse('\n').isClean(), true);

      done();
   });

   it('empty status', (done) => {
      git.status(function (err: Error, status: StatusSummary) {
         test.equals([], status.created,      'No new files');
         test.equals([], status.deleted,      'No removed files');
         test.equals([], status.modified,     'No modified files');
         test.equals([], status.not_added,    'No untracked files');
         test.equals([], status.conflicted,   'No conflicted files');
         done();
      });

      helper.closeWith('');
   });

   it('staged modified files identified separately to other modified files', (done) => {
      const summary = StatusSummary.parse(`
            ## master
             M aaa
            M  bbb
            A  ccc
            ?? ddd
      `);

      test.deepEqual(summary.staged, ['bbb']);
      test.deepEqual(summary.modified, ['aaa', 'bbb']);
      done();
   });

   it('staged modified file with modifications after staging', (done) => {
      const summary = StatusSummary.parse(`
            ## master
            MM staged-modified
             M modified
            M  staged
      `);

      test.deepEqual(summary.staged, ['staged-modified', 'staged']);
      test.deepEqual(summary.modified, ['staged-modified', 'modified', 'staged']);
      done();
   });

   it('modified status', (done) => {
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
      done();
   });

   it('index/wd status', (done) => {
      git.status(function (err: Error, status: StatusSummary) {
         test.same(status.files, [
            {path: 'src/git_wd.js', index: ' ', working_dir: 'M', from: ''},
            {path: 'src/git_ind_wd.js', index: 'M', working_dir: 'M', from: ''},
            {path: 'src/git_ind.js', index: 'M', working_dir: ' ', from: ''}
         ]);

         done();
      });

      helper.closeWith(`
 M src/git_wd.js
MM src/git_ind_wd.js
M  src/git_ind.js
`);
   });

});
