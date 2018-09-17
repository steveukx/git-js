'use strict';

const sinon = require('sinon');

var sandbox = null;
var git = null;

const {Instance, childProcessEmits, closeWith, errorWith, theCommandRun, theEnvironmentVariables, restore} =
   require('./include/setup');

exports.setUp = function (done) {
    sandbox = sinon.createSandbox();
    restore();
    done();
};

exports.tearDown = function (done) {
    restore();
    sandbox.restore();
    done();
};

exports.childProcess = {
    setUp: function (done) {
        sandbox.stub(console, 'error');
        git = Instance();
        done();
    },

    'handles child process errors': function (test) {
        git.init(function (err) {
            test.equals('SOME ERROR', err);
            test.done();
        });

        errorWith('SOME ERROR');
        closeWith(-2);
    },

   'passes empty set of environment variables by default': function (test) {
      git.init(() => {
            test.same(null, theEnvironmentVariables());
            test.done();
         });

      closeWith('');
   },

   'supports passing individual environment variables to the underlying child process': function (test) {
      git.env('foo', 'bar')
         .init(() => {
            test.same({foo: 'bar'}, theEnvironmentVariables());
            test.done();
         });

      closeWith('');
   },

   'supports passing environment variables to the underlying child process': function (test) {
      git.env({baz: 'bat'})
         .init(() => {
            test.same({baz: 'bat'}, theEnvironmentVariables());
            test.done();
         });

      closeWith('');
   }
};

exports.diff = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    'bin summary': function (test) {
        const DiffSummary = require('../../src/responses/DiffSummary');
        const summary = DiffSummary.parse(`
 my-package.tar.gz | Bin 3163 -> 3244 bytes
 1 file changed, 0 insertions(+), 0 deletions(-)
 `);

        test.equal(summary.insertions, 0);
        test.equal(summary.deletions, 0);
        test.equal(summary.files.length, 1);
        test.same(summary.files[{
            file: 'my-package.tar.gz',
            before: 3163,
            after: 3244,
            binary: true
        }]);
        test.done();
    },

    'with summary': function (test) {
        git.diffSummary(function (err, diffSummary) {
            test.same(['diff', '--stat=4096'], theCommandRun());
            test.equals(diffSummary.insertions, 1);
            test.equals(diffSummary.deletions, 2);
            test.equals(diffSummary.files.length, 1);

            var diffFileSummary = diffSummary.files[0];
            test.equals(diffFileSummary.file, 'package.json');
            test.equals(diffFileSummary.changes, 3);
            test.equals(diffFileSummary.insertions, 1);
            test.equals(diffFileSummary.deletions, 2);
            test.done();
        });

        closeWith('\
            package.json | 3 +--\n\
            1 file changed, 1 insertion(+), 2 deletions(-)\n\
       ');
    },

    'with summary and options': function (test) {
        git.diffSummary(['opt-a', 'opt-b'], function () {
            test.same(['diff', '--stat=4096', 'opt-a', 'opt-b'], theCommandRun());
            test.done();
        });

        closeWith('\
            package.json | 3 +--\n\
            1 file changed, 1 insertion(+), 2 deletions(-)\n\
       ');
    },

    'with summary and option': function (test) {
        git.diffSummary('opt-a', function () {
            test.same(['diff', '--stat=4096', 'opt-a'], theCommandRun());
            test.done();
        });

        closeWith('\
            package.json | 3 +--\n\
            1 file changed, 1 insertion(+), 2 deletions(-)\n\
       ');
    },

    'with summary multiple files': function (test) {
        var diffFileSummary;

        git.diffSummary(function (err, diffSummary) {
            test.same(['diff', '--stat=4096'], theCommandRun());
            test.equals(diffSummary.insertions, 26);
            test.equals(diffSummary.deletions, 0);
            test.equals(diffSummary.files.length, 2);

            diffFileSummary = diffSummary.files[0];
            test.equals(diffFileSummary.file, 'src/git.js');
            test.equals(diffFileSummary.changes, 6);
            test.equals(diffFileSummary.insertions, 6);
            test.equals(diffFileSummary.deletions, 0);

            diffFileSummary = diffSummary.files[1];
            test.equals(diffFileSummary.file, 'test/testCommands.js');
            test.equals(diffFileSummary.changes, 20);
            test.equals(diffFileSummary.insertions, 20);
            test.equals(diffFileSummary.deletions, 0);

            test.done();
        });

        closeWith('\
            src/git.js           |  6 ++++++\n\
            test/testCommands.js | 20 ++++++++++++++++++++\n\
            2 files changed, 26 insertions(+)\n\
       ');
    }
};

exports.init = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    'with just a handler': function (test) {
        git.init(function (err) {
            test.equals(null, err, 'not an error');
            test.same(["init"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'as a bare repo': function (test) {
        git.init(true, function (err) {
            test.equals(null, err, 'not an error');
            test.same(["init", "--bare"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'as a regular repo': function (test) {
        git.init('truthy value', function (err) {
            test.equals(null, err, 'not an error');
            test.same(["init"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'no handler': function (test) {
        git.init();
        closeWith('');

        setTimeout(function () {
            test.same(["init"], theCommandRun());
            test.done();
        });
    }
};

exports.config = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    'add': function (test) {
        git.addConfig('user.name', 'test', function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(
               ['config', '--local', 'user.name', 'test'],
               theCommandRun());
            test.done();
        });

        closeWith('');
    }
};

exports.reset = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    hard: function (test) {
        git.reset('hard', function (err) {
            test.equals(null, err, 'not an error');
            test.same(
               ["reset", "--hard"],
               theCommandRun());
            test.done();
        });

        closeWith('');
    },

    soft: function (test) {
        git.reset('soft', function (err) {
            test.equals(null, err, 'not an error');
            test.same(
               ["reset", "--soft"],
               theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'reset hard to commit': function (test) {
        git.reset(['commit-ish', '--hard'], function (err) {
            test.equals(null, err, 'not an error');
            test.same(
               ["reset", "commit-ish", "--hard"],
               theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'reset hard to commit with no handler': function (test) {
        git.reset(['commit-ish', '--hard']);

        closeWith('');
        setTimeout(function () {
            test.same(["reset", "commit-ish", "--hard"], theCommandRun());
            test.done();
        });
    },

    'no handler': function (test) {
        git.reset();
        closeWith('');

        setTimeout(function () {
            test.same(["reset", "--soft"], theCommandRun());
            test.done();
        });
    }
};

exports.revParse = {
    setUp: function (done) {
        git = Instance();
        git.silent(false);
        sandbox.stub(console, 'warn');
        done();
    },

    'deprecated usage': function (test) {
        var then = sinon.spy();
        git.revparse('HEAD', then);

        closeWith('').then(() => {
           test.ok(then.calledOnce);
           test.ok(then.calledWith(null, ''));
           test.ok(console.warn.calledOnce);

           test.done();
        });
    },

    'valid usage': function (test) {
        var then = sinon.spy();
        git.revparse(['HEAD'], then);

        closeWith('').then(() => {
           test.ok(then.calledOnce);
           test.ok(then.calledWith(null, ''));
           test.ok(console.warn.notCalled);
           test.done();
        });
    },

    'called with a string': function (test) {
        git.revparse('some string');
        test.same(
           ["rev-parse", "some", "string"],
           theCommandRun());
        test.done();
    },

    'called with an array of strings': function (test) {
        git.revparse(['another', 'string']);
        test.same(
           ["rev-parse", "another", "string"],
           theCommandRun());
        test.done();
    }
};

exports.rm = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    'remove single file': function (test) {
        git.rm('string', function (err, data) {
            test.same(['rm', '-f', 'string'], theCommandRun());
            test.done();
        });

        closeWith('anything');
    },

    'remove multiple files': function (test) {
        git.rm(['another', 'string'], function (err, data) {
            test.same(['rm', '-f', 'another', 'string'], theCommandRun());
            test.done();
        });

        closeWith('anything');
    }
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

exports.subModule = {
    setUp: function (done) {
        sandbox.stub(console, 'warn');
        git = Instance();
        done();
    },

    'update with no args': function (test) {
        git.submoduleUpdate(function (err, result) {
            test.equals(null, err, 'not an error');
            test.equals('', result, 'passes through the result');
            test.same(["submodule", "update"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'update with string arg': function (test) {
        git.submoduleUpdate('foo', function (err, result) {
            test.ok(console.warn.called, 'should warn invalid usage');
            test.equals(null, err, 'not an error');
            test.equals('', result, 'passes through the result');
            test.same(["submodule", "update", "foo"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'update with array arg': function (test) {
        git.submoduleUpdate(['foo', 'bar'], function (err, result) {
            test.equals(null, err, 'not an error');
            test.equals('', result, 'passes through the result');
            test.same(["submodule", "update", "foo", "bar"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'init with no args': function (test) {
        git.submoduleInit(function (err, result) {
            test.equals(null, err, 'not an error');
            test.equals('', result, 'passes through the result');
            test.same(["submodule", "init"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'init with string arg': function (test) {
        git.submoduleInit('foo', function (err, result) {
            test.ok(console.warn.called, 'should warn invalid usage');
            test.equals(null, err, 'not an error');
            test.equals('', result, 'passes through the result');
            test.same(["submodule", "init", "foo"], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'init with array arg': function (test) {
        git.submoduleInit(['foo', 'bar'], function (err, result) {
            test.equals(null, err, 'not an error');
            test.equals('', result, 'passes through the result');
            test.same(["submodule", "init", "foo", "bar"], theCommandRun());
            test.done();
        });

        closeWith('');
    }
};

exports.checkIgnore = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    'with single excluded file specified': function (test) {
        git.checkIgnore('foo.log', function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(['check-ignore', 'foo.log'], theCommandRun());
            test.same(['foo.log'], result);

            test.done();
        });

        closeWith('foo.log');
    },

    'with two excluded files specified': function (test) {
        git.checkIgnore(['foo.log', 'bar.log'], function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(['check-ignore', 'foo.log', 'bar.log'], theCommandRun());
            test.same(['foo.log', 'bar.log'], result);

            test.done();
        });

        closeWith('foo.log\n\
        bar.log\
        ');
    },

    'with no excluded files': function (test) {
        git.checkIgnore(['foo.log', 'bar.log'], function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(['check-ignore', 'foo.log', 'bar.log'], theCommandRun());
            test.same([], result);

            test.done();
        });

        closeWith('');
    },

    'with spaces in file names': function (test) {
        git.checkIgnore('foo space .log', function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(['check-ignore', 'foo space .log'], theCommandRun());
            test.same(['foo space .log'], result);

            test.done();
        });

        closeWith('\
            foo space .log\
        ');
    }
};

exports.checkout = {
    setUp: function (done) {
        git = Instance();
        done();
    },

    'simple checkout': function (test) {
        git.checkout('something', function (err, result) {
            test.equals(null, err);
            test.same(['checkout', 'something'], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'checkoutBranch': function (test) {
        git.checkoutBranch('branch', 'start', function (err, result) {
            test.equals(null, err);
            test.same(['checkout', '-b', 'branch', 'start'], theCommandRun());
            test.done();
        });

        closeWith('');
    },

    'checkoutLocalBranch': function (test) {
        git.checkoutLocalBranch('new-branch', function (err, result) {
            test.equals(null, err);
            test.same(['checkout', '-b', 'new-branch'], theCommandRun());
            test.done();
        });

        closeWith('');
    }
};

exports.updateServerInfo = {
    setUp: function(done) {
        git = Instance();
        done();
    },

    'update server info': function (test) {
        git.updateServerInfo(function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["update-server-info"], theCommandRun());

            test.done();
        });

        closeWith('');
    }
};
