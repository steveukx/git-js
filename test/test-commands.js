'use strict';

function MockBuffer (content, type) {
    this.type = type;
    this.toString = function () { return content; }
}

MockBuffer.concat = function () {

};

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

    var Buffer = MockBuffer;
    Buffer.concat = sinon.spy(function (things) {
        return [].join.call(things, '\n'); });

    return git = new Git(baseDir, new MockChildProcess, Buffer);
}

function closeWith (data) {
    if (typeof data === "string") {
        mockChildProcesses[mockChildProcesses.length - 1].stdout.on.args[0][1](data);
    }

    mockChildProcesses[mockChildProcesses.length - 1].on.args.forEach(function (handler) {
        if (handler[0] === 'close') {
            handler[1](typeof data === "number" ? data : 0);
        }
    });
}

function errorWith (someMessage) {
    var handlers = mockChildProcesses[mockChildProcesses.length - 1].on.args;
    handlers.forEach(function (handler) {
        if (handler[0] === 'error') {
            handler[1]({
                stack: someMessage
            });
        }
    });
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

exports.childProcess = {
    setUp: function (done) {
        Instance();
        done()
    },

    'handles child process errors': function (test) {
        git.init(function (err) {
            test.equals('SOME ERROR', err);
            test.done();
        });

        errorWith('SOME ERROR');
        closeWith(-2);
    }
};

exports.clone = {
    setUp: function (done) {
        Instance();
        done();
    },

    'clone with repo and local': function (test) {
        git.clone('repo', 'lcl', function (err, data) {
            test.same(['clone', 'repo', 'lcl'], theCommandRun());
            test.same('anything', data);
            test.equals(null, err, 'not an error');

            test.done();
        });

        closeWith('anything');
    },

    'clone with options': function (test) {
        git.clone('repo', 'lcl', ['foo', 'bar'], function (err, data) {
            test.same(['clone', 'foo', 'bar', 'repo', 'lcl'], theCommandRun());
            test.done();
        });

        closeWith('anything');
    },

    'explicit mirror': function (test) {
        git.mirror('r', 'l', function () {
            test.same(['clone', '--mirror', 'r', 'l'], theCommandRun());
            test.done();
        });

        closeWith();
    }
};

exports.cwd = {
    setUp: function (done) {
        Instance('/base/dir');
        done();
    },

    'changes working directory': function (test) {
        var callbacks = 0;
        git
           .init(function () {
               callbacks++;
               test.equals('/base/dir', mockChildProcess.spawn.args[0][2].cwd)
            })
           .cwd('/something/else')
           .init(function () {
               callbacks++;
               test.equals('/something/else', mockChildProcess.spawn.args[2][2].cwd);

               test.done();
           });

        closeWith('');
        setTimeout(function () {
            closeWith('')
        }, 25);
        setTimeout(function () {
            closeWith('')
        }, 50);
    }
};

exports.commit = {
    setUp: function (done) {
        Instance();
        done();
    },

    'commit with an author set': function (test) {
        git.commit('some message', 'fileName.ext', {'--author': '"Some Author <some@author.com>"'}, function () {
            test.same(
               ["commit", "-m", "some message", "fileName.ext", "--author=\"Some Author <some@author.com>\""],
               theCommandRun());

            test.done();
        });

        closeWith('');
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

    'commit with single file specified and multiple line commit': function (test) {
        git.commit(['some', 'message'], 'fileName.ext', function (err, commit) {
            test.equals('unitTests', commit.branch, 'Should be on unitTests branch');
            test.equals('44de1ee', commit.commit, 'Should pick up commit hash');
            test.equals(3, commit.summary.changes, 'Should pick up changes count');
            test.equals(12, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(29, commit.summary.insertions, 'Should pick up insertions count');

            test.same(
               ["commit", "-m", "some", "-m" ,"message", "fileName.ext"],
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

    'commit with multiple files specified and multiple line commit': function (test) {
        git.commit(['some', 'message'], ['fileName.ext', 'anotherFile.ext'], function (err, commit) {

            test.equals('branchNameInHere', commit.branch, 'Should pick up branch name');
            test.equals('CommitHash', commit.commit, 'Should pick up commit hash');
            test.equals(3, commit.summary.changes, 'Should pick up changes count');
            test.equals(12, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(29, commit.summary.insertions, 'Should pick up insertions count');

            test.same(
               ["commit", "-m", "some", "-m" ,"message", "fileName.ext", "anotherFile.ext"],
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

    'commit with no files specified and multiple line commit': function (test) {
        git.commit(['some', 'message'], function (err, commit) {

            test.equals('branchNameInHere', commit.branch, 'Should pick up branch name');
            test.equals('CommitHash', commit.commit, 'Should pick up commit hash');
            test.equals(3, commit.summary.changes, 'Should pick up changes count');
            test.equals(12, commit.summary.deletions, 'Should pick up deletions count');
            test.equals(10, commit.summary.insertions, 'Should pick up insertions count');

            test.same(
               ["commit", "-m", "some", "-m" ,"message"],
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

exports.diff = {
    setUp: function (done) {
        Instance();
        done();
    },

    'with summary': function (test) {
        git.diffSummary(function (err, diffSummary) {
            test.same(['diff', '--stat'], theCommandRun());
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
            test.same(['diff', '--stat', 'opt-a', 'opt-b'], theCommandRun());
            test.done();
        });

        closeWith('\
            package.json | 3 +--\n\
            1 file changed, 1 insertion(+), 2 deletions(-)\n\
       ');
    },

    'with summary and option': function (test) {
        git.diffSummary('opt-a', function () {
            test.same(['diff', '--stat', 'opt-a'], theCommandRun());
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
            test.same(['diff', '--stat'], theCommandRun());
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

exports.catFile = {
    setUp: function(done) {
        Instance();
        done();
    },

    'displays tree for initial commit hash': function(test) {

        git.catFile(["-p", "366e4409"], function(err, result) {

            test.equals(null, err, 'not an error');
            test.same(["cat-file", "-p", "366e4409"], theCommandRun());
            test.same(([
                '100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d    .gitignore',
                '100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81    .npmignore',
                '100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf    package.json',
                '100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a    readme.md',
                '040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541    src'
            ].join('\n')), result);

            test.done();
        });

        closeWith([
            '100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d    .gitignore',
            '100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81    .npmignore',
            '100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf    package.json',
            '100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a    readme.md',
            '040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541    src'
        ].join('\n'))
    },

    'displays valid usage when no arguments passed': function(test) {

        git.catFile(function(err, result) {

            // TODO: Add catch for empty response and prompt for valid hash and update test
            var errMsg = 'Please pass in a valid (tree/commit/object) hash';
            test.equals(null, err, 'not an error');
            test.same(["cat-file"], theCommandRun());
            test.same(result, errMsg);

            test.done();
        });

        closeWith('Please pass in a valid (tree/commit/object) hash')
    }
};

exports.init = {
    setUp: function (done) {
        Instance();
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

exports.log = {
    setUp: function (done) {
        Instance();
        done();
    },


    'picks out the latest item': function (test) {
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
        ].join('\n'))
    },

    'uses custom splitter': function (test) {
        git.log({splitter: "::"}, function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["log", "--pretty=format:%H::%ai::%s%d::%aN::%ae"], theCommandRun());
            test.same('ca931e641eb2929cf86093893e9a467e90bf4c9b', result.latest.hash, 'knows which is latest');
            test.same(4, result.total, 'picked out all items');

            test.done();
        });

        closeWith([
            'ca931e641eb2929cf86093893e9a467e90bf4c9b::2016-01-04 18:54:56 +0100::Fix log.latest. (HEAD, stmbgr-master)::stmbgr::stmbgr@gmail.com',
            '8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805::2016-01-03 16:02:22 +0000::Release 1.20.0 (origin/master, origin/HEAD, master)::Steve King::steve@mydev.co',
            'd4bdd0c823584519ddd70f8eceb8ff06c0d72324::2016-01-03 16:02:04 +0000::Support for any parameters to `git log` by supplying `options` as an array (tag: 1.20.0)::Steve King::ste',
            '207601debebc170830f2921acf2b6b27034c3b1f::2016-01-03 15:50:58 +0000::Release 1.19.0::Steve King::steve@mydev.co'
        ].join('\n'))
    },

    'with explicit from and to': function (test) {
        git.log('from', 'to', function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "from...to"], theCommandRun());
            test.done();
        });

        closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
    },

    'with options array': function (test) {
        git.log(['--some=thing'], function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "--some=thing"], theCommandRun());
            test.done();
        });

        closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
    },

    'with max count shorthand property': function (test) {
        git.log({n: 5}, function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "--max-count=5"], theCommandRun());
            test.done();
        });

        closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
    },

    'with max count longhand property': function (test) {
        git.log({n: 5}, function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["log", "--pretty=format:%H;%ai;%s%d;%aN;%ae", "--max-count=5"], theCommandRun());
            test.done();
        });

        closeWith('17df9a7421dd86920cd20afd1d6b6be527a89b88;2015-11-24 11:55:47 +0100;add reset command;Mark Oswald;markoswald123@googlemail.com\n\
4e0d08e0653101fb4d8da3ea3420f5c490401e9e;2015-11-19 22:03:49 +0000;Release 1.12.0 (origin/master, origin/HEAD);Steve King;steve@mydev.co\n\
83f3f60d5899116fe4d38b9109c9d925963856da;2015-11-19 13:54:28 +0000;Merge pull request #51 from ebaioni/patch-1 (tag: 1.12.0);Steve King;steve@mydev.co\n\
c515d3f28f587312d816e14ef04db399b7e0adcd;2015-11-19 15:55:41 +1100;updates command to customBinary;Enrico Baioni;baio88@gmail.com\n\
570223e86f0999fd3b39280ad33081e5155d1003;2015-10-12 22:01:05 +0100;Release 1.11.0;Steve King;steve@mydev.co\
');
    }
};

exports.merge = {
    setUp: function (done) {
        Instance();
        done();
    },

    merge: function (test) {
        git.merge(['--no-ff', 'someOther-master'], function (err) {
            test.same(['merge', '--no-ff', 'someOther-master'], theCommandRun());
            test.done();
        });
        closeWith('Merge made by the \'recursive\' strategy.\n\
           src/File.js | 16 ++++++++++++----\n\
           test/fileTest.js     | 24 ++++++++++++++++++++++++\n\
           2 files changed, 36 insertions(+), 4 deletions(-)\n\
        ');
    },

    mergeFromTo: function (test) {
        git.mergeFromTo('aaa', 'bbb', function (err) {
            test.same(['merge', 'aaa', 'bbb'], theCommandRun());
            test.done();
        });
        closeWith('');
    },

    mergeFromToWithOptions: function (test) {
        git.mergeFromTo('aaa', 'bbb', ['x', 'y'], function (err) {
            test.same(['merge', 'aaa', 'bbb', 'x', 'y'], theCommandRun());
            test.done();
        });
        closeWith('');
    },

    mergeFromToWithBadOptions: function (test) {
        git.mergeFromTo('aaa', 'bbb', 'x', function (err) {
            test.same(['merge', 'aaa', 'bbb'], theCommandRun());
            test.done();
        });
        closeWith('');
    }
};

exports.remotes = {
    setUp: function (done) {
        Instance();
        done();
    },

    'get list': function (test) {
        git.getRemotes(function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["remote"], theCommandRun());
            test.same([
                {name: 'origin', refs: {}},
                {name: 'upstream', refs: {}}
            ], result, 'parses response');
            test.done();
        });

        closeWith('\
        origin\n\
        upstream');
    },

    'get verbose list': function (test) {
        git.getRemotes(true, function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["remote", "-v"], theCommandRun());
            test.same([
                {name: 'origin', refs: {fetch: 's://u@d.com/u/repo.git', push: 's://u@d.com/u/repo.git'}},
                {name: 'upstream', refs: {fetch: 's://u@d.com/another/repo.git', push: 's://u@d.com/another/repo.git'}}
            ], result, 'parses response');
            test.done();
        });

        closeWith('\
        origin    s://u@d.com/u/repo.git (fetch)\n\
        origin    s://u@d.com/u/repo.git (push)\n\
        upstream  s://u@d.com/another/repo.git (fetch)\n\
        upstream  s://u@d.com/another/repo.git (push)\n\
        ');
    },

    'Does not throw when there is no supplied function': function (test) {
        git.getRemotes(true);

        test.doesNotThrow(function () {
            closeWith('\
            origin    s://u@d.com/u/repo.git (fetch)\n\
            origin    s://u@d.com/u/repo.git (push)\n\
            upstream  s://u@d.com/another/repo.git (fetch)\n\
            upstream  s://u@d.com/another/repo.git (push)\n\
            ');
        });

        test.done();
    }
};

exports.config = {
    setUp: function (done) {
        Instance();
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

exports.rm = {
    setUp: function (done) {
        Instance();
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

exports.pull = {
    setUp: function (done) {
        Instance();
        done();
    },

    'pulls with spaces in names': function (test) {
        git.pull(function (err, result) {
            test.same(['pull'], theCommandRun());
            test.same(result.files.length, 21);
            test.done();
        });

        closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 accounting_core_report.kjs |  45 +++++++++-------\n\
 ap.invoice.kjs             |   2 +-\n\
 ar.deposit.kjs             |   6 +--\n\
 ar.invoice_detail.kjs      |  16 +++---\n\
 ar.receipt.kjs             |  10 +++-\n\
 gl.bank_statement.kjs      |   6 +++\n\
 gl.kjs                     | 106 ++++++++++++++++++++++++++------------\n\
 kis.call.kjs               |   2 +\n\
 kis.call_stats_report.kjs  | 289 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\
 kis.edit_recurring.kjs     |   8 +--\n\
 kis.kdr_logs.kjs           |   8 ---\n\
 kpo.batch_pay.kjs          |  19 ++++---\n\
 kpo.fiscal_year.kjs        |  93 +++++++++++++++++++++++++++++----\n\
 kpo.kjs                    |   2 +-\n\
 kpo.payment.kjs            |   3 ++\n\
 kpo.po_adjustment.kjs      |  82 +++++++++++++++++++++++------\n\
 kpo.purchase_order.kjs     |  12 +++--\n\
 kpo.reports.kjs            |  79 +++++++++++++++-------------\n\
 kpo.warrant.kjs            |  17 +++---\n\
 time_tracking.schedule.kjs | 342 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------------------------------\n\
 21 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');

    },

    'pulls with options': function (test) {
        git.pull(null, null, {'--rebase': null}, function (err, result) {
            test.same(['pull', '--rebase'], theCommandRun());
            test.same(result.files.length, 1);
            test.done();
        });

        closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 2 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');
    },

    'pulls with options without branch detail': function (test) {
        git.pull({'--no-rebase': null}, function (err, result) {
            test.same(['pull', '--no-rebase'], theCommandRun());
            test.same(result.files.length, 1);
            test.done();
        });

        closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 2 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
');
    },

    'pulls with rebase options with value': function (test) {
        git.pull('origin', 'master', { '--rebase' : 'true' }, function (err, result) {
            test.same(['pull', 'origin', 'master', '--rebase=true'], theCommandRun());
            test.same(result.files.length, 1);
            test.done();
        });

        closeWith('\n\
From git.kellpro.net:apps/templates\n\
* branch            release/0.33.0 -> FETCH_HEAD\n\
Updating 1c6e99e..2a5dc63\n\
Fast-forward\n\
 accounting_core.kjs        |  61 +++++++++++-----------\n\
 2 files changed, 856 insertions(+), 352 deletions(-)\n\
 create mode 100644 kis.call_stats_report.kjs\n\
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

exports.subModule = {
    setUp: function (done) {
        Instance();
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

exports.tag = {
    setUp: function (done) {
        Instance();
        done();
    },

    'with max count shorthand property': function (test) {
        git.tags(function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["tag", "-l"], theCommandRun());
            test.equals('1.2.1', result.latest);
            test.same(['0.1.1', '1.1.1', '1.2.1'], result.all);

            test.done();
        });

        closeWith('0.1.1\n\
        1.2.1\n\
        1.1.1\
        ');
    },

    'removes empty lines': function (test) {
        git.tags(function (err, result) {
            test.equals(null, err, 'not an error');
            test.same(["tag", "-l"], theCommandRun());
            test.equals('1.10.0', result.latest);
            test.same(['0.1.0', '0.2.0', '0.10.0', '0.10.1', '1.10.0', 'tagged'], result.all);

            test.done();
        });

        closeWith('\n\
    0.1.0\n\
    0.10.0\n\
    0.10.1\n\
    0.2.0\n\
    1.10.0\n\
    tagged\n\
');
    }
};

exports.checkIgnore = {
    setUp: function (done) {
        Instance();
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
        Instance();
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

exports.stashList = {
    setUp: function (done) {
        Instance();
        done();
    },

    'with no stash': function (test) {
        git.stashList(function (err, result) {
            test.equals(null, err, 'not an error');
            test.equals(0, result.total);
            test.same([], result.all);
            test.done();
        });

        closeWith('');
    },

    'with a stash of two elements': function (test) {
        git.stashList(function (err, result) {
            test.equals(null, err, 'not an error');

            test.equals(2, result.total, 'should have 2 elements in the stash');
            test.equals(2, result.all.length, 'should have 2 elements in the stash');
            test.same(result.latest, result.all[0], 'should have found the latest');

            test.same(result.latest.hash, '8701efc4f6663bcdc6908001926c077c4a983f71', 'should have found the hash');
            test.same(result.latest.date, '2016-07-08 14:58:53 -0400', 'should have found the date');
            test.same(result.latest.message, 'WIP on master: 1234567 commit comment 1 (refs/stash)', 'should have found the message');

            test.done();
        });

        closeWith('\
8701efc4f6663bcdc6908001926c077c4a983f71;2016-07-08 14:58:53 -0400;WIP on master: 1234567 commit comment 1 (refs/stash);Some Author;some@author.com\n\
a8f9fd225fda404fab96c6a39bd2cc4fa423286f;2016-06-06 18:18:43 -0400;WIP on master: 7654321 commit comment 2;Some Author;some@author.com');
    },
};

exports.updateServerInfo = {
    setUp: function(done) {
        Instance();
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
