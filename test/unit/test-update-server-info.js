const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');

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
