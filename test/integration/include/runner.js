'use strict';

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var FS = require('fs');

module.exports = function Test(setup, test) {

   var context = {
      root: FS.mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-'),
      git: require('../../../'),
      gitP: require('../../../promise'),
      deferred: function deferred() {
         var d = {};
         d.promise = new _Promise(function (resolve, reject) {
            d.resolve = resolve;
            d.reject = reject;
         });

         return d;
      }
   };

   this.setUp = function (done) {
      _Promise.resolve(context).then(setup).then(function () {
         done();
      });
   };

   this.tearDown = function (done) {
      done();
   };

   this.test = function (runner) {
      var done = function done(result) {
         if (result && result.message) {
            runner.ok(false, result.message);
         }

         runner.done();
      };

      _Promise.resolve().then(function () {
         return test(context, runner);
      }).then(done, done);
   };
};