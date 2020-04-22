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

jestify(exports);
