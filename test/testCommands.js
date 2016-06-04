
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

exports.branch = {
    setUp: function (done) {
        Instance();
        done();
    },

    'detached branches': function (test) {
        var BranchSummary = require('../src/BranchSummary');
        var branchSummary = BranchSummary.parse('\
* (detached from 1.6.0)              2b2dba2 Add tests for commit\n\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
  master                             cb4be06 Release 1.30.0\n\
');

        test.equals('1.6.0', branchSummary.current);
        test.equals(true, branchSummary.detached);

        test.same(['1.6.0', 'cflynn07-add-git-ignore', 'master'], branchSummary.all);
        test.done();
    },

    'gets branch data': function (test) {
        git.branch(function (err, branchSummary) {
            test.ok(branchSummary instanceof require('../src/BranchSummary'), 'Uses the BranchSummary response type');
            test.equals(null, err, 'not an error');
            test.equals('drschwabe-add-branches', branchSummary.current);
            test.same(['cflynn07-add-git-ignore', 'drschwabe-add-branches', 'master'], branchSummary.all);

            test.same('Release 1.30.0', branchSummary.branches.master.label);
            test.same('cb4be06', branchSummary.branches.master.commit);

            test.done();
        });

        closeWith('\
  cflynn07-add-git-ignore            a0b67a3 Add support for filenames containing spaces\n\
* drschwabe-add-branches             063069b Merge branch \'add-branches\' of https://github.com/drschwabe/git-js into drschwabe-add-branches\n\
  master                             cb4be06 Release 1.30.0\n\
        ');
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
                '100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d	.gitignore',
                '100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81	.npmignore',
                '100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf	package.json',
                '100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a	readme.md',
                '040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541	src'
            ].join('\n')), result);

            test.done();
        });

        closeWith([
            '100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d	.gitignore',
            '100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81	.npmignore',
            '100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf	package.json',
            '100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a	readme.md',
            '040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541	src'
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
    },

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

exports.push = {
    setUp: function (done) {
        Instance();
        done();
    },

    'git push can set multiple options': function (test) {
        git.push(['foo', 'bar'], function (err, result) {
            test.same(['push', 'foo', 'bar'], theCommandRun());
            test.done();
        });
        closeWith('');
    },

    'git push can set branch and remote': function (test) {
        git.push('rrr', 'bbb', function (err, result) {
            test.same(['push', 'rrr', 'bbb'], theCommandRun());
            test.done();
        });
        closeWith('');
    },

    'git push can run with no arguments': function (test) {
        git.push(function (err, result) {
            test.same(['push'], theCommandRun());
            test.done();
        });
        closeWith('');
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

exports.status = {
    setUp: function (done) {
        Instance();
        done();
    },

    'uses branch detail and returns a StatusSummary': function (test) {
        git.status(function (err, status) {
            test.same(["status", "--porcelain", "-b"], theCommandRun());
            test.ok(status instanceof require('../src/StatusSummary'));
            test.done();
        });

        closeWith('');
    },

    'parses status': function (test) {
        var statusSummary;
        var StatusSummary = require('../src/StatusSummary');

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

        test.done();
    },

    'reports on clean branch': function (test) {
        var StatusSummary = require('../src/StatusSummary');
        ['M', 'AM', 'UU', 'D'].forEach(function (type) {
            test.same(StatusSummary.parse(type + ' file-name.foo').isClean(), false);
        });
        test.same(StatusSummary.parse('\n').isClean(), true);

        test.done();
    },

    'empty status': function (test) {
        git.status(function (err, status) {
            test.equals(0, status.created,      'No new files');
            test.equals(0, status.deleted,      'No removed files');
            test.equals(0, status.modified,     'No modified files');
            test.equals(0, status.not_added,    'No untracked files');
            test.equals(0, status.conflicted,   'No conflicted files');
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
            test.equals(1, status.conflicted.length,   'No conflicted files');
            test.done();
        });

        test.equals(1, mockChildProcesses.length, 'Spawns one process per task');
        closeWith(' M package.json\n\
        M src/git.js\n\
        AM src/index.js \n\
        A src/newfile.js \n\
        AM test.js\n\
        ?? test/ \n\
        UU test.js\n\
        ');
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
