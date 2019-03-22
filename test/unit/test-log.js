'use strict';

const {theCommandRun, restore, Instance, closeWith} = require('./include/setup');
const sinon = require('sinon');
const ListLogSummary = require('../../src/responses/ListLogSummary');

const commitSplitter = ListLogSummary.COMMIT_BOUNDARY;

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

      closeWith([
         'ca931e641eb2929cf86093893e9a467e90bf4c9b;2016-01-04 18:54:56 +0100;Fix log.latest. (HEAD, stmbgr-master);stmbgr;stmbgr@gmail.com',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805;2016-01-03 16:02:22 +0000;Release 1.20.0 (origin/master, origin/HEAD, master);Steve King;steve@mydev.co',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324;2016-01-03 16:02:04 +0000;Support for any parameters to `git log` by supplying `options` as an array (tag: 1.20.0);Steve King;ste',
         '207601debebc170830f2921acf2b6b27034c3b1f;2016-01-03 15:50:58 +0000;Release 1.19.0;Steve King;steve@mydev.co'
      ].join(`${commitSplitter}\n`))
   },

   'uses custom splitter' (test) {
      git.log({splitter: "::"}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H::%ai::%s::%d::%aN::%ae${commitSplitter}`], theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
         test.same(4, result.total, 'picked out all items');

         test.done();
      });

      closeWith([
         'ca931e641eb2929cf86093893e9a467e90bf4c9b::2016-01-04 18:54:56 +0100::Fix log.latest.::(HEAD, stmbgr-master)::stmbgr::stmbgr@gmail.com',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805::2016-01-03 16:02:22 +0000::Release 1.20.0::(origin/master, origin/HEAD, master)::Steve King::steve@mydev.co',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324::2016-01-03 16:02:04 +0000::Support for any parameters to `git log` by supplying `options` as an array::(tag: 1.20.0)::Steve King::ste',
         '207601debebc170830f2921acf2b6b27034c3b1f::2016-01-03 15:50:58 +0000::Release 1.19.0::Steve King::steve@mydev.co'
      ].join(`${commitSplitter}\n`))
   },

   'with explicit from and to' (test) {
      git.log('from', 'to', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s;%d;%aN;%ae${commitSplitter}`, "from...to"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with options array' (test) {
      git.log(['--some=thing'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s;%d;%aN;%ae${commitSplitter}`, "--some=thing"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with max count shorthand property' (test) {
      git.log({n: 5}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s;%d;%aN;%ae${commitSplitter}`, "--max-count=5"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with max count longhand property' (test) {
      git.log({n: 5}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s;%d;%aN;%ae${commitSplitter}`, "--max-count=5"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'with custom options' (test) {
      git.log({n: 5, '--custom': null, '--custom-with-value': '123'}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:%H;%ai;%s;%d;%aN;%ae${commitSplitter}`,
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
            `--pretty=format:%H;%ai;%s;%d;%aN;%ae${commitSplitter}`,
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
            `--pretty=format:%H;%s;%D${commitSplitter}`
         ], theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.myhash, 'custom field name');
         test.same('Fix log.latest.', result.latest.message);
         test.same('HEAD, stmbgr-master', result.latest.refs);
         test.done();
      });


      closeWith([
           'ca931e641eb2929cf86093893e9a467e90bf4c9b;Fix log.latest.;HEAD, stmbgr-master',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805;Release 1.20.0;origin/master, origin/HEAD, master',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324;Support for any parameters to `git log` by supplying `options` as an array;tag: 1.20.0',
         '207601debebc170830f2921acf2b6b27034c3b1f;Release 1.19.0;'
      ].join(`${commitSplitter}\n`))

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
            `--pretty=format:%H;%b;%D${commitSplitter}`
         ], theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.myhash, 'custom field name');
         test.same('Fix log.latest.\n\nDescribe the fix', result.latest.message);
         test.same('HEAD, stmbgr-master', result.latest.refs);
         test.same('tag: 1.20.0', result.all.slice(-1)[0].refs);
         test.done();
      });


      closeWith([
         "ca931e641eb2929cf86093893e9a467e90bf4c9b;Fix log.latest.\n\nDescribe the fix;HEAD, stmbgr-master",
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805;Release 1.20.0;origin/master, origin/HEAD, master',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324;Support for any parameters to `git log` by supplying `options` as an array;tag: 1.20.0' + commitSplitter,
      ].join(`${commitSplitter}\n`))

   },

   'with custom format %b option on multiline commit' (test) {
      git.log({
         format: {
           'message': '%b',
         }
      }, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:%b${commitSplitter}`
         ], theCommandRun());
         test.same('Fix log.latest.\n\nDescribe the fix', result.latest.message);
         test.same('Release 1.19.0', result.all.slice(-1)[0].message);
         test.done();
      });


      closeWith([
         "Fix log.latest.\n\nDescribe the fix",
         'Release 1.20.0',
         'Support for any parameters to `git log` by supplying `options` as an array',
         'Release 1.19.0' + commitSplitter
      ].join(`${commitSplitter}\n`))

   },

   'parses regular log' (test) {
      const text = `
a9d0113c896c69d24583f567030fa5a8053f6893||Add support for 'git.raw' (origin/add_raw, add_raw)${commitSplitter}
d8cb111160e0a5925ef9b0bf21abda96d87fdc83||Merge remote-tracking branch 'origin/master' into add_raw${commitSplitter}
204f2fd1d77ee5f8475c47f44acc8014d7534b00||Add support for 'git.raw'${commitSplitter}
1dde94c3a06b6e9b7cc88fb32ee23d79eaf39aa6||Merge pull request #143 from steveukx/integration-test${commitSplitter}
8b613d080027354d4e8427d93b3f839ebb38c39a||Add broken-chain tests${commitSplitter}
`;
      const listLogSummary = ListLogSummary.parse(text, '||', ['hash', 'message']);
      test.equals(listLogSummary.total, 5);
      test.deepEqual(listLogSummary.latest, {
         hash: 'a9d0113c896c69d24583f567030fa5a8053f6893',
         message: 'Add support for \'git.raw\' (origin/add_raw, add_raw)'
      });

      test.done();
   },

   'includes branch detail separate to commit message' (test) {
      const summary = ListLogSummary.parse(`
686f728356919989acd412c5f323d858acd5b873;2019-03-22 19:21:50 +0000;Merge branch 'x' of y/git-js into xy; (HEAD -> RobertAKARobin-feature/no-refs-in-log);Steve King;steve@mydev.co${commitSplitter}
1787912f37880deeb302b75b3dfb0c0d47a42572;2019-03-22 19:21:08 +0000;1.108.0; (tag: v1.108.0, origin/master, origin/HEAD, master);Steve King;steve@mydev.co${commitSplitter}
167e909a9f947889067ea59a54e0f8b5a9cf9225;2019-03-22 19:20:21 +0000;Remove \`.npmignore\` - publishing uses the \`package.json\` \`files\` array instead;;Steve King;steve@mydev.co${commitSplitter}
f3f103257fefb4a0f6cef5d65d6466d2dda105a8;2019-03-22 19:00:04 +0000;Merge branch 'tvongeldern-master';;Steve King;steve@mydev.co${commitSplitter}
6dac0c61d77fcbb9b7c10848d3be55bb84217b1b;2019-03-22 18:59:44 +0000;Switch to utility function in place of constant; (tvongeldern-master);Steve King;steve@mydev.co${commitSplitter}
      `, ';', ['hash', 'date', 'message', 'branch', 'author_name', 'author_email']);

      test.equal(summary.latest.message, `Merge branch 'x' of y/git-js into xy`);
      test.equal(summary.latest.branch, `(HEAD -> RobertAKARobin-feature/no-refs-in-log)`);

      test.done();
   }

};
