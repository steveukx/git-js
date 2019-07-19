'use strict';

const {theCommandRun, restore, Instance, instanceP, closeWith, closeWithP} = require('./include/setup');
const sinon = require('sinon');
const ListLogSummary = require('../../src/responses/ListLogSummary');

const commitSplitter = ListLogSummary.COMMIT_BOUNDARY;
const {START_BOUNDARY, COMMIT_BOUNDARY, SPLITTER} = ListLogSummary;

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   sandbox.stub(console, 'warn');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.logP = {

   setUp (done) {
      git = instanceP(sandbox);
      done();
   },

   'with stat=4096 and custom format / splitter' (test) {
      git.log({'--stat': '4096', 'splitter': ' !! ', 'format': { hash: '%H', author: '%aN' }}).then(log => {

         test.same(['log', `--pretty=format:${ START_BOUNDARY }%H !! %aN${COMMIT_BOUNDARY}`, '--stat=4096'], theCommandRun());
         test.same(1, log.total);
         test.same('5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b', log.latest.hash);
         test.same('kobbikobb', log.latest.author);
         test.same(
            {
               deletions: 43,
               insertions: 70,
               files: [
                  { file: 'foo.js', changes: 113, insertions: 70, deletions: 43, binary: false },
               ]
            }, log.all[0].diff);
         test.done();
      });

      closeWithP(`
òòòòòò 5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b !! kobbikobb òò
 foo.js | 113 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------------------------------------
 1 file changed, 70 insertions(+), 43 deletions(-)

      `)
   },

   'with shortstat' (test) {
      git.log(['--shortstat']).then(log => {

         test.same(['log', `--pretty=format:${ START_BOUNDARY }%H${ SPLITTER }%ai${ SPLITTER }%s${ SPLITTER }%D${ SPLITTER }%b${ SPLITTER }%aN${ SPLITTER }%ae${COMMIT_BOUNDARY}`, '--shortstat'], theCommandRun());
         test.same(4, log.all.length);
         test.same({deletions: 43, insertions: 70, files: []}, log.latest.diff);
         test.done();
      });

      closeWithP(`
òòòòòò 5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b ò 2019-07-18 00:10:25 +0000 ò Exposes issue #382 ò HEAD -> pr/383 ò  ò kobbikobb ò jakobjo@temposoftware.com òò
 1 file changed, 70 insertions(+), 43 deletions(-)

òòòòòò 4ecd1349876c3914b0294fcfa482c8d3add054db ò 2019-07-14 09:25:52 +0100 ò 1.121.0 ò tag: v1.121.0, origin/master, origin/HEAD, master ò  ò Steve King ò steve@mydev.co òò
 1 file changed, 1 insertion(+), 1 deletion(-)

òòòòòò 1e4bf3959481d20586e05c849e965b015c400187 ò 2019-07-14 09:25:33 +0100 ò Merge branch 'dependencies' ò  ò  ò Steve King ò steve@mydev.co òò
òòòòòò d2934ee302221577157640cb8cc4995a915f7367 ò 2019-07-14 09:15:16 +0100 ò Update dependencies to remove fully deprecated (and now vulnerable) nodeunit while the v2 rewrite is in progress ò origin/dependencies, dependencies ò  ò Steve King ò steve@mydev.co òò
 3 files changed, 71 insertions(+), 2254 deletions(-)

      `);
   },

   'with stat' (test) {

      git.log(['--stat']).then(log => {

         test.same(['log', `--pretty=format:${ START_BOUNDARY }%H${ SPLITTER }%ai${ SPLITTER }%s${ SPLITTER }%D${ SPLITTER }%b${ SPLITTER }%aN${ SPLITTER }%ae${COMMIT_BOUNDARY}`, '--stat'], theCommandRun());
         test.same(4, log.total);
         test.same(
            {
               deletions: 43,
               insertions: 70,
               files: [
                  { file: 'foo.js', changes: 113, insertions: 70, deletions: 43, binary: false },
               ]
            }, log.all[0].diff);
         test.same(null, log.all[2].diff);
         test.same(3, log.all[3].diff.files.length);
         test.done();
      });

      closeWithP(`
òòòòòò 5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b ò 2019-07-18 00:10:25 +0000 ò Exposes issue #382 ò HEAD -> pr/383 ò  ò kobbikobb ò jakobjo@temposoftware.com òò
 foo.js | 113 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------------------------------------
 1 file changed, 70 insertions(+), 43 deletions(-)

òòòòòò 4ecd1349876c3914b0294fcfa482c8d3add054db ò 2019-07-14 09:25:52 +0100 ò 1.121.0 ò tag: v1.121.0, origin/master, origin/HEAD, master ò  ò Steve King ò steve@mydev.co òò
 package.json | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

òòòòòò 1e4bf3959481d20586e05c849e965b015c400187 ò 2019-07-14 09:25:33 +0100 ò Merge branch 'dependencies' ò  ò  ò Steve King ò steve@mydev.co òò
òòòòòò d2934ee302221577157640cb8cc4995a915f7367 ò 2019-07-14 09:15:16 +0100 ò Update dependencies to remove fully deprecated (and now vulnerable) nodeunit while the v2 rewrite is in progress ò origin/dependencies, dependencies ò  ò Steve King ò steve@mydev.co òò
 .gitignore   |    1 -
 package.json |   12 +-
 yarn.lock    | 2312 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 3 files changed, 71 insertions(+), 2254 deletions(-)

      `);
   },

   'allows for multi-line commit messages' (test) {
      git.log({ multiLine: true })
         .then(log => {
            test.same(['log', `--pretty=format:òòòòòò %H ò %ai ò %s ò %D ò %B ò %aN ò %ae${COMMIT_BOUNDARY}`], theCommandRun());

            test.same('hello\nworld\n', log.all[0].body);
            test.same('hello world', log.all[0].message);

            test.same('blah\n', log.all[1].body);
            test.same('blah', log.all[1].message);

            test.done();
         });

      closeWithP(`
${ START_BOUNDARY }aaf7f71d53fdbe5f1783f4cc34514cb1067b9131 ò 2019-07-09 11:33:17 +0100 ò hello world ò HEAD -> master ò hello
world
 ò Steve King ò steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }592ea103c33666fc4faf80e7fd68e655619ce137 ò 2019-07-03 07:11:52 +0100 ò blah ò  ò blah
 ò Steve King ò steve@mydev.co${ COMMIT_BOUNDARY }
      `);
   },

   'allows for single-line commit messages' (test) {
      git.log({ multiLine: false })
         .then(log => {
            test.same(['log', `--pretty=format:òòòòòò %H ò %ai ò %s ò %D ò %b ò %aN ò %ae${COMMIT_BOUNDARY}`], theCommandRun());

            test.same('', log.all[0].body);
            test.same('hello world', log.all[0].message);

            test.same('', log.all[1].body);
            test.same('blah', log.all[1].message);

            test.done();
         });

      closeWithP(`
${ START_BOUNDARY }aaf7f71d53fdbe5f1783f4cc34514cb1067b9131 ò 2019-07-09 11:33:17 +0100 ò hello world ò HEAD -> master ò  ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
${ START_BOUNDARY }592ea103c33666fc4faf80e7fd68e655619ce137 ò 2019-07-03 07:11:52 +0100 ò blah ò  ò  ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
      `);

   },

   'allows for custom format multi-line commit messages' (test) {
      git.log({ format: { body: '%B', hash: '%H' }, splitter: '||' })
         .then(log => {
            test.same(['log', `--pretty=format:òòòòòò %B||%H${COMMIT_BOUNDARY}`], theCommandRun());

            test.deepEqual(log.all, [
               { hash: 'aaf7f71d53fdbe5f1783f4cc34514cb1067b9131', body: 'hello\nworld\n' },
               { hash: '592ea103c33666fc4faf80e7fd68e655619ce137', body: 'blah\n' },
            ]);

            test.done();
         });

      closeWithP(`
${ START_BOUNDARY }hello
world
||aaf7f71d53fdbe5f1783f4cc34514cb1067b9131${COMMIT_BOUNDARY}
${ START_BOUNDARY }blah
||592ea103c33666fc4faf80e7fd68e655619ce137${COMMIT_BOUNDARY}
      `);

   }

};


exports.log = {
   setUp (done) {
      git = Instance();
      done();
   },


   'picks out the latest item' (test) {
      git.log(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
         test.same(4, result.total, 'picked out all items');

         test.done();
      });

      closeWith(`
${ START_BOUNDARY }ca931e641eb2929cf86093893e9a467e90bf4c9b ò 2016-01-04 18:54:56 +0100 ò Fix log.latest. (HEAD, stmbgr-master) ò stmbgr ò stmbgr@gmail.com${ COMMIT_BOUNDARY }
${ START_BOUNDARY }8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805 ò 2016-01-03 16:02:22 +0000 ò Release 1.20.0 (origin/master, origin/HEAD, master) ò Steve King ò steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }d4bdd0c823584519ddd70f8eceb8ff06c0d72324 ò 2016-01-03 16:02:04 +0000 ò Support for any parameters to \`git log\` by supplying \`options\` as an array (tag: 1.20.0) ò Steve King ò ste${ COMMIT_BOUNDARY }
${ START_BOUNDARY }207601debebc170830f2921acf2b6b27034c3b1f ò 2016-01-03 15:50:58 +0000 ò Release 1.19.0 ò Steve King ò steve@mydev.co${ COMMIT_BOUNDARY }
      `);
   },

   'uses custom splitter' (test) {
      git.log({splitter: "::"}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['log', `--pretty=format:${ START_BOUNDARY }%H::%ai::%s::%D::%b::%aN::%ae${commitSplitter}`], theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
         test.same(4, result.total, 'picked out all items');

         test.done();
      });

      closeWith(`
${ START_BOUNDARY }ca931e641eb2929cf86093893e9a467e90bf4c9b::2016-01-04 18:54:56 +0100::Fix log.latest. (HEAD, stmbgr-master)::stmbgr::stmbgr@gmail.com${ COMMIT_BOUNDARY }
${ START_BOUNDARY }8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805::2016-01-03 16:02:22 +0000::Release 1.20.0 (origin/master, origin/HEAD, master)::Steve King::steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }d4bdd0c823584519ddd70f8eceb8ff06c0d72324::2016-01-03 16:02:04 +0000::Support for any parameters to \`git log\` by supplying \`options\` as an array (tag: 1.20.0)::Steve King::ste${ COMMIT_BOUNDARY }
${ START_BOUNDARY }207601debebc170830f2921acf2b6b27034c3b1f::2016-01-03 15:50:58 +0000::Release 1.19.0::Steve King::steve@mydev.co${ COMMIT_BOUNDARY }
      `);
   },

   'with explicit from and to' (test) {
      git.log('from', 'to', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`, "from...to"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with explicit symmetric from and to' (test) {

      const options = {
         from: 'from',
         to: 'to',
         symmetric: true
      };

      git.log(options, function (err) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`, "from...to"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with non-symmetric from and to' (test) {
      const options = {
         from: 'from',
         to: 'to',
         symmetric: false
      };
      git.log(options, function (err) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`, "from..to"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with options array' (test) {
      git.log(['--some=thing'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`, "--some=thing"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with max count shorthand property' (test) {
      git.log({n: 5}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`, "--max-count=5"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with max count longhand property' (test) {
      git.log({n: 5}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`, "--max-count=5"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with custom options' (test) {
      git.log({n: 5, '--custom': null, '--custom-with-value': '123'}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`,
            "--max-count=5",
            "--custom",
            "--custom-with-value=123"
         ], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'max count appears before file' (test) {
      git.log({n: 10, file: '/foo/bar.txt'}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:${ START_BOUNDARY }%H ò %ai ò %s ò %D ò %b ò %aN ò %ae${commitSplitter}`,
            "--max-count=10",
            "--follow",
            "/foo/bar.txt"
         ], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with custom format option' (test) {
      git.log({
         format: {
            'myhash': '%H',
            'message': '%s',
            'refs': '%D'
         }
      }, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:${ START_BOUNDARY }%H ò %s ò %D${commitSplitter}`
         ], theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.myhash, 'custom field name');
         test.same('Fix log.latest.', result.latest.message);
         test.same('HEAD, stmbgr-master', result.latest.refs);
         test.done();
      });


      closeWith(`
${ START_BOUNDARY }ca931e641eb2929cf86093893e9a467e90bf4c9b ò Fix log.latest. ò HEAD, stmbgr-master${ COMMIT_BOUNDARY }
${ START_BOUNDARY }8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805 ò Release 1.20.0 ò origin/master, origin/HEAD, master${ COMMIT_BOUNDARY }
${ START_BOUNDARY }d4bdd0c823584519ddd70f8eceb8ff06c0d72324 ò Support for any parameters to \`git log\` by supplying \`options\` as an array ò tag: 1.20.0${ COMMIT_BOUNDARY }
${ START_BOUNDARY }207601debebc170830f2921acf2b6b27034c3b1f ò Release 1.19.0 ò ${ COMMIT_BOUNDARY }
      `);

   },

   'with custom format option on multiline commit' (test) {
      git.log({
         format: {
            'myhash': '%H',
            'message': '%b',
            'refs': '%D'
         }
      }, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:${ START_BOUNDARY }%H ò %b ò %D${commitSplitter}`
         ], theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.myhash, 'custom field name');
         test.same('Fix log.latest.\n\nDescribe the fix', result.latest.message);
         test.same('HEAD, stmbgr-master', result.latest.refs);
         test.same('tag: 1.20.0', result.all.slice(-1)[0].refs);
         test.done();
      });


      closeWith(`
${ START_BOUNDARY }ca931e641eb2929cf86093893e9a467e90bf4c9b ò Fix log.latest.

Describe the fix ò HEAD, stmbgr-master${ COMMIT_BOUNDARY }
${ START_BOUNDARY }8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805 ò Release 1.20.0 ò origin/master, origin/HEAD, master${ COMMIT_BOUNDARY }
${ START_BOUNDARY }d4bdd0c823584519ddd70f8eceb8ff06c0d72324 ò Support for any parameters to \`git log\` by supplying \`options\` as an array ò tag: 1.20.0${ COMMIT_BOUNDARY }
      `);

   },

   'with custom format %b option on multiline commit' (test) {
      git.log({
         format: {
            'message': '%b',
         }
      }, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:${ START_BOUNDARY }%b${commitSplitter}`], theCommandRun());
         test.same('Fix log.latest.\n\nDescribe the fix', result.latest.message);
         test.same('Release 1.19.0', result.all.slice(-1)[0].message);
         test.done();
      });


      closeWith(`
${ START_BOUNDARY }Fix log.latest.

Describe the fix${ COMMIT_BOUNDARY }
${ START_BOUNDARY }Release 1.20.0${ COMMIT_BOUNDARY }
${ START_BOUNDARY }Support for any parameters to \`git log\` by supplying \`options\` as an array${ COMMIT_BOUNDARY }
${ START_BOUNDARY }Release 1.19.0${ COMMIT_BOUNDARY }
      `);

   },

   'parses regular log' (test) {
      const text = `
${ START_BOUNDARY }a9d0113c896c69d24583f567030fa5a8053f6893||Add support for 'git.raw' (origin/add_raw, add_raw)${ COMMIT_BOUNDARY }
${ START_BOUNDARY }d8cb111160e0a5925ef9b0bf21abda96d87fdc83||Merge remote-tracking branch 'origin/master' into add_raw${ COMMIT_BOUNDARY }
${ START_BOUNDARY }204f2fd1d77ee5f8475c47f44acc8014d7534b00||Add support for 'git.raw'${ COMMIT_BOUNDARY }
${ START_BOUNDARY }1dde94c3a06b6e9b7cc88fb32ee23d79eaf39aa6||Merge pull request #143 from steveukx/integration-test${ COMMIT_BOUNDARY }
${ START_BOUNDARY }8b613d080027354d4e8427d93b3f839ebb38c39a||Add broken-chain tests${ COMMIT_BOUNDARY }
`;
      const listLogSummary = ListLogSummary.parse(text, '||', ['hash', 'message']);
      test.equals(listLogSummary.total, 5);
      test.deepEqual(listLogSummary.latest, {
         hash: 'a9d0113c896c69d24583f567030fa5a8053f6893',
         message: 'Add support for \'git.raw\' (origin/add_raw, add_raw)'
      });

      test.done();
   },

   'includes refs detail separate to commit message' (test) {
      const summary = ListLogSummary.parse(`
${ START_BOUNDARY }686f728356919989acd412c5f323d858acd5b873;2019-03-22 19:21:50 +0000;Merge branch 'x' of y/git-js into xy;HEAD -> RobertAKARobin-feature/no-refs-in-log;Steve King;steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }1787912f37880deeb302b75b3dfb0c0d47a42572;2019-03-22 19:21:08 +0000;1.108.0;tag: v1.108.0, origin/master, origin/HEAD, master;Steve King;steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }167e909a9f947889067ea59a54e0f8b5a9cf9225;2019-03-22 19:20:21 +0000;Remove \`.npmignore\` - publishing uses the \`package.json\` \`files\` array instead;;Steve King;steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }f3f103257fefb4a0f6cef5d65d6466d2dda105a8;2019-03-22 19:00:04 +0000;Merge branch 'tvongeldern-master';;Steve King;steve@mydev.co${ COMMIT_BOUNDARY }
${ START_BOUNDARY }6dac0c61d77fcbb9b7c10848d3be55bb84217b1b;2019-03-22 18:59:44 +0000;Switch to utility function in place of constant;tvongeldern-master;Steve King;steve@mydev.co${ COMMIT_BOUNDARY }
      `, ';', ['hash', 'date', 'message', 'refs', 'author_name', 'author_email']);

      test.equal(summary.latest.message, `Merge branch 'x' of y/git-js into xy`);
      test.equal(summary.latest.refs, `HEAD -> RobertAKARobin-feature/no-refs-in-log`);

      test.done();
   },

   'includes body detail in log message' (test) {
      const summary = ListLogSummary.parse(`
${ START_BOUNDARY }f1db07b4d526407c419731c5d6863a019f4bc051;2019-03-23 08:04:04 +0000;Merge branch 'master' into pr/333;HEAD -> pr/333;# Conflicts:
#       src/git.js
#       test/unit/test-log.js
;Steve King;steve@mydev.co${commitSplitter}
${ START_BOUNDARY }8a5278c03a4dce0d2da64f8743d6e296b4060122;2019-03-23 07:59:05 +0000;Change name of the '%d' placeholder to'refs';master, RobertAKARobin-feature/git-log-body;;Steve King;steve@mydev.co${commitSplitter}
${ START_BOUNDARY }e613462dc8384deab7c4046e7bc8b5370a295e14;2019-03-23 07:24:21 +0000;Change name of the '%d' placeholder to'refs';;;Steve King;steve@mydev.co${commitSplitter}
      `, ';', ['hash', 'date', 'message', 'refs', 'body', 'author_name', 'author_email']);

      test.ok(/^# Conflicts:/.test(summary.latest.body));

      test.done();
   },

   'include additional options to the "git log" command' (test) {
      const options = {
         format: {
            'message': '%b',
         },
         '--reflog': null,
         '--stat-width': '10',
      };

      const expected = [
         'log',
         `--pretty=format:${ START_BOUNDARY }%b${ COMMIT_BOUNDARY }`,
         '--reflog',
         '--stat-width=10',
      ];

      git.log(options, () => {
         test.same(expected, theCommandRun());
         test.done();
      });

      closeWith('');
   }

};
