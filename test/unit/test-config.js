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

jestify(exports);
