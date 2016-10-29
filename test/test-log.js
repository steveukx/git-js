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
      ].join('\n'))
   },

   'uses custom splitter': function (test) {
      git.log({splitter: "::"}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", "--pretty=format:%H::%ai::%s%d::%aN::%ae"], setup.theCommandRun());
         test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
         test.same(4, result.total, 'picked out all items');

         test.done();
      });

      setup.closeWith([
         'ca931e641eb2929cf86093893e9a467e90bf4c9b::2016-01-04 18:54:56 +0100::Fix log.latest. (HEAD, stmbgr-master)::stmbgr::stmbgr@gmail.com',
         '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805::2016-01-03 16:02:22 +0000::Release 1.20.0 (origin/master, origin/HEAD, master)::Steve King::steve@mydev.co',
         'd4bdd0c823584519ddd70f8eceb8ff06c0d72324::2016-01-03 16:02:04 +0000::Support for any parameters to `git log` by supplying `options` as an array (tag: 1.20.0)::Steve King::ste',
         '207601debebc170830f2921acf2b6b27034c3b1f::2016-01-03 15:50:58 +0000::Release 1.19.0::Steve King::steve@mydev.co'
      ].join('\n'))
   },

   'with explicit from and to': function (test) {
      git.log('from', 'to', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "from...to"], setup.theCommandRun());
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
         test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "--some=thing"], setup.theCommandRun());
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
         test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "--max-count=5"], setup.theCommandRun());
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
         test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "--max-count=5"], setup.theCommandRun());
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
            "--pretty=format:%H;%ai;%s%d;%aN;%ae",
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
            "--pretty=format:%H;%s;%D"
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
      ].join('\n'))

   }
};

