const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, restore, MockChildProcess} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore(sandbox);
   done();
};

exports.show = {
   setUp: function (done) {
      sandbox.stub(console, 'warn');
      git = Instance();
      done();
   },

   'allows the use of an array of options': function (test) {
      git.show(['--abbrev-commit', 'foo', 'bar'], function (err, result) {
         test.same(0, console.warn.callCount);
         test.same(
            ["show", "--abbrev-commit", "foo", "bar"],
            theCommandRun());

         test.done();
      });

      closeWith('commit 2d4d33a\n\
        Author: Some Name <some.name@gmail.com>\n\
        Date:   Sun Oct 11 00:06:10 2015 +0200\n\
        \
        Some commit message\n\
        \
        diff --git a/src/file.js b/src/file.js\n\
        index ab02a9b..5000197 100644\n\
        --- a/src/file.js\n\
        +++ b/src/file.js\n\
@@ -468,8 +468,13 @@\n\
        existing unchanged content\n\
        -        removed content\n\
        +        added content\n\
        remaining content\n');
   },

   'allows an options string': function (test) {
      git.show('--abbrev-commit', function (err, result) {
         test.same(1, console.warn.callCount);
         test.same(
            ["show", "--abbrev-commit"],
            theCommandRun());

         test.done();
      });

      closeWith('commit 2d4d33a\n\
        Author: Some Name <some.name@gmail.com>\n\
        Date:   Sun Oct 11 00:06:10 2015 +0200\n\
        \
        Some commit message\n\
        \
        diff --git a/src/file.js b/src/file.js\n\
        index ab02a9b..5000197 100644\n\
        --- a/src/file.js\n\
        +++ b/src/file.js\n\
@@ -468,8 +468,13 @@\n\
        existing unchanged content\n\
        -        removed content\n\
        +        added content\n\
        remaining content\n');

   }
};

jestify(exports);
