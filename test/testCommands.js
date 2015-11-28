
function MockChild () {
    mockChildProcesses.push(this);
    this.stdout = {
        on: sinon.spy()
    };
    this.stderr = {
        on: sinon.spy()
    };
    this.on = sinon.spy();
}

function MockChildProcess () {
    mockChildProcess = this;
    this.spawn = sinon.spy(function () {
        return new MockChild();
    });
}

function Instance (baseDir) {
    var Git = require('../src/git');

    return git = new Git(baseDir, new MockChildProcess, {concat: sinon.spy(function (things) { return [].join.call(things, '\n'); })});
}

function closeWith (data) {
    var stdout = mockChildProcesses[mockChildProcesses.length - 1].stdout.on.args[0][1];
    var close = mockChildProcesses[mockChildProcesses.length - 1].on.args[0][1];

    stdout(data);
    close(0);
}

function theCommandRun() {
    return mockChildProcess.spawn.args[0][1];
}

var sinon = require('sinon'), sandbox;
var git, mockChildProcess, mockChildProcesses = [];

exports.setUp = function (done) {
    sandbox = sinon.sandbox.create();
    done();
};

exports.tearDown = function (done) {
    git = mockChildProcess = null;
    mockChildProcesses = [];
    sandbox.restore();
    done();
};

exports.reset = {
    setUp: function (done) {
        Instance();
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

    'no handler': function (test) {
        git.reset();
        closeWith('');

        setTimeout(function () {
            test.same(["reset", "--soft"], theCommandRun());
            test.done();
        });
    }
};

exports.status = {
    setUp: function (done) {
        Instance();
        done();
    },

    'empty status': function (test) {
        git.status(function (err, status) {
            test.equals(0, status.created,      'No new files');
            test.equals(0, status.deleted,      'No removed files');
            test.equals(0, status.modified,     'No modified files');
            test.equals(0, status.not_added,    'No untracked files');
            test.done();
        });

        test.equals(1, mockChildProcesses.length, 'Spawns one process per task');
        closeWith('');
    },

    'modified status': function (test) {
        git.status(function (err, status) {
            test.equals(3, status.created.length,      'No new files');
            test.equals(0, status.deleted.length,      'No removed files');
            test.equals(2, status.modified.length,     'No modified files');
            test.equals(1, status.not_added.length,    'No un-tracked files');
            test.done();
        });

        test.equals(1, mockChildProcesses.length, 'Spawns one process per task');
        closeWith(' M package.json\n\
        M src/git.js\n\
        AM src/index.js \n\
        A src/newfile.js \n\
        AM test.js\n\
        ?? test/ \n\
        ');
    }
};

exports.show = {
    setUp: function (done) {
        sandbox.stub(console, 'warn');
        Instance();
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

exports.commit = {
    setUp: function (done) {
        Instance();
        done();
    },

    'commit with single file specified': function (test) {
        git.commit('some message', 'fileName.ext', function (err, commit) {
            test.equals('unitTests', commit.branch, 'Should be on unitTests branch');
            test.equals('44de1ee', commit.commit, 'Should pick up commit hash');
            test.equals(3, commit.summary.changes, 'Should pick up changes count');
            test.equals(12, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(29, commit.summary.insertions, 'Should pick up insertions count');

            test.same(
                ["commit", "-m", "some message", "fileName.ext"],
                theCommandRun());

            test.done();
        });

        closeWith('[unitTests 44de1ee] Add nodeunit test runner\n\
        3 files changed, 29 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
    },

    'commit with multiple files specified': function (test) {
        git.commit('some message', ['fileName.ext', 'anotherFile.ext'], function (err, commit) {

            test.equals('branchNameInHere', commit.branch, 'Should pick up branch name');
            test.equals('CommitHash', commit.commit, 'Should pick up commit hash');
            test.equals(3, commit.summary.changes, 'Should pick up changes count');
            test.equals(12, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(29, commit.summary.insertions, 'Should pick up insertions count');

            test.same(
                ["commit", "-m", "some message", "fileName.ext", "anotherFile.ext"],
                theCommandRun());

            test.done();
        });

        closeWith('[branchNameInHere CommitHash] Add nodeunit test runner\n\
        3 files changed, 29 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
    },

    'commit with no files specified': function (test) {
        git.commit('some message', function (err, commit) {

            test.equals('branchNameInHere', commit.branch, 'Should pick up branch name');
            test.equals('CommitHash', commit.commit, 'Should pick up commit hash');
            test.equals(3, commit.summary.changes, 'Should pick up changes count');
            test.equals(12, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(10, commit.summary.insertions, 'Should pick up insertions count');

            test.same(
                ["commit", "-m", "some message"],
                theCommandRun());

            test.done();
        });

        closeWith('[branchNameInHere CommitHash] Add nodeunit test runner\n\
        3 files changed, 10 insertions(+), 12 deletions(-)\n\
        create mode 100644 src/index.js');
    },

    'commit when no files are staged': function (test) {
        git.commit('some message', function (err, commit) {

            test.equals('', commit.branch, 'Should pick up branch name');
            test.equals('', commit.commit, 'Should pick up commit hash');
            test.equals(0, commit.summary.changes, 'Should pick up changes count');
            test.equals(0, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(0, commit.summary.insertions, 'Should pick up insertions count');

            test.done();
        });

        closeWith('On branch master\n\
        Your branch is ahead of \'origin/master\' by 1 commit.\n\
           (use "git push" to publish your local commits)\n\n\
        Changes not staged for commit:\n\
        modified:   src/some-file.js\n\
        modified:   src/another-file.js\n\n\
        no changes added to commit\n\
        ');
    }
};

exports.revParse = {
    setUp: function (done) {
        Instance();
        git.silent(false);
        sandbox.stub(console, 'warn');
        done();
    },

    'deprecated usage': function (test) {
        var then = sinon.spy();
        git.revparse('HEAD', then);

        closeWith('');
        test.ok(then.calledOnce);
        test.ok(then.calledWith(null, ''));
        test.ok(console.warn.calledOnce);

        test.done();
    },

    'valid usage': function (test) {
        var then = sinon.spy();
        git.revparse(['HEAD'], then);

        closeWith('');
        test.ok(then.calledOnce);
        test.ok(then.calledWith(null, ''));
        test.ok(console.warn.notCalled);
        test.done();
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
