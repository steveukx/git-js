import { newSimpleGit } from "./__fixtures__";

const jestify = require('../jestify');
const {theCommandRun, closeWithSuccess, restore} = require('./include/setup');

let git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.updateServerInfo = {
   setUp: function(done) {
      git = newSimpleGit();
      done();
   },

   'update server info': function (test) {
      git.updateServerInfo(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["update-server-info"], theCommandRun());

         test.done();
      });

      closeWithSuccess();
   }
};

jestify(exports);
