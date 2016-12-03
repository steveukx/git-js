'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');
const ListLogSummary = require('../../src/responses/ListLogSummary');

const commitSplitter = ListLogSummary.COMMIT_BOUNDARY;

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


exports.log = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },


   'picks out the latest item': function (test) {
      git.log(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
         test.same(4, result.total, 'picked out all items');

         test.done();
      });

      setup.closeWith([
         'ca931e641eb2929cf86093893e9a467e90bf4c9b;2016-01-04 18:54:56 +0100;Fix log.latest. (HEAD, stmbgr-master);stmbgr;stmbgr@gmail.com',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805;2016-01-03 16:02:22 +0000;Release 1.20.0 (origin/master, origin/HEAD, master);Steve King;steve@mydev.co',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324;2016-01-03 16:02:04 +0000;Support for any parameters to `git log` by supplying `options` as an array (tag: 1.20.0);Steve King;ste',
         '207601debebc170830f2921acf2b6b27034c3b1f;2016-01-03 15:50:58 +0000;Release 1.19.0;Steve King;steve@mydev.co'
      ].join(`${commitSplitter}\n`))
   },

   'uses custom splitter': function (test) {
      git.log({splitter: "::"}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H::%ai::%s%d::%aN::%ae${commitSplitter}`], setup.theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
         test.same(4, result.total, 'picked out all items');

         test.done();
      });

      setup.closeWith([
         'ca931e641eb2929cf86093893e9a467e90bf4c9b::2016-01-04 18:54:56 +0100::Fix log.latest. (HEAD, stmbgr-master)::stmbgr::stmbgr@gmail.com',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805::2016-01-03 16:02:22 +0000::Release 1.20.0 (origin/master, origin/HEAD, master)::Steve King::steve@mydev.co',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324::2016-01-03 16:02:04 +0000::Support for any parameters to `git log` by supplying `options` as an array (tag: 1.20.0)::Steve King::ste',
         '207601debebc170830f2921acf2b6b27034c3b1f::2016-01-03 15:50:58 +0000::Release 1.19.0::Steve King::steve@mydev.co'
      ].join(`${commitSplitter}\n`))
   },

   'with explicit from and to': function (test) {
      git.log('from', 'to', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s%d;%aN;%ae${commitSplitter}`, "from...to"], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
   },

   'with options array': function (test) {
      git.log(['--some=thing'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s%d;%aN;%ae${commitSplitter}`, "--some=thing"], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
   },

   'with max count shorthand property': function (test) {
      git.log({n: 5}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s%d;%aN;%ae${commitSplitter}`, "--max-count=5"], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
   },

   'with max count longhand property': function (test) {
      git.log({n: 5}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", `--pretty=format:%H;%ai;%s%d;%aN;%ae${commitSplitter}`, "--max-count=5"], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
   },

   'with custom options': function (test) {
      git.log({n: 5, '--custom': null, '--custom-with-value': '123'}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:%H;%ai;%s%d;%aN;%ae${commitSplitter}`,
            "--max-count=5",
            "--custom",
            "--custom-with-value=123"
         ], setup.theCommandRun());
         test.done();
      });

      setup.closeWith('');
   },

   'with custom format option': function (test) {
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
         ], setup.theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.myhash, 'custom field name');
         test.same('Fix log.latest.', result.latest.message);
         test.same('HEAD, stmbgr-master', result.latest.refs);
         test.done();
      });


      setup.closeWith([
           'ca931e641eb2929cf86093893e9a467e90bf4c9b;Fix log.latest.;HEAD, stmbgr-master',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805;Release 1.20.0;origin/master, origin/HEAD, master',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324;Support for any parameters to `git log` by supplying `options` as an array;tag: 1.20.0',
         '207601debebc170830f2921acf2b6b27034c3b1f;Release 1.19.0;'
      ].join(`${commitSplitter}\n`))

   },

   'with custom format option on multiline commit': function (test) {
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
         ], setup.theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.myhash, 'custom field name');
         test.same('Fix log.latest.\n\nDescribe the fix', result.latest.message);
         test.same('HEAD, stmbgr-master', result.latest.refs);
         test.same('tag: 1.20.0', result.all.slice(-1)[0].refs);
         test.done();
      });


      setup.closeWith([
         "ca931e641eb2929cf86093893e9a467e90bf4c9b;Fix log.latest.\n\nDescribe the fix;HEAD, stmbgr-master",
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805;Release 1.20.0;origin/master, origin/HEAD, master',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324;Support for any parameters to `git log` by supplying `options` as an array;tag: 1.20.0' + commitSplitter,
      ].join(`${commitSplitter}\n`))

   },

   'with custom format %b option on multiline commit ': function (test) {
      git.log({
         format: {
           'message': '%b',
         }
      }, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same([
            "log",
            `--pretty=format:%b${commitSplitter}`
         ], setup.theCommandRun());
         test.same('Fix log.latest.\n\nDescribe the fix', result.latest.message);
         test.same('Release 1.19.0', result.all.slice(-1)[0].message);
         test.done();
      });


      setup.closeWith([
         "Fix log.latest.\n\nDescribe the fix",
         'Release 1.20.0',
         'Support for any parameters to `git log` by supplying `options` as an array',
         'Release 1.19.0' + commitSplitter
      ].join(`${commitSplitter}\n`))

   },

   'parses regular log': function (test) {
      var text = `
a9d0113c896c69d24583f567030fa5a8053f6893||Add support for 'git.raw' (origin/add_raw, add_raw)${commitSplitter}
d8cb111160e0a5925ef9b0bf21abda96d87fdc83||Merge remote-tracking branch 'origin/master' into add_raw${commitSplitter}
204f2fd1d77ee5f8475c47f44acc8014d7534b00||Add support for 'git.raw'${commitSplitter}
1dde94c3a06b6e9b7cc88fb32ee23d79eaf39aa6||Merge pull request #143 from steveukx/integration-test${commitSplitter}
8b613d080027354d4e8427d93b3f839ebb38c39a||Add broken-chain tests${commitSplitter}
`;
      var listLogSummary = ListLogSummary.parse(text, '||', ['hash', 'message']);
      test.equals(listLogSummary.total, 5);
      test.deepEqual(listLogSummary.latest, {
         hash: 'a9d0113c896c69d24583f567030fa5a8053f6893',
         message: 'Add support for \'git.raw\' (origin/add_raw, add_raw)'
      });

      test.done();
   }

};
