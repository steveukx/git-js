'use strict';

const FS = require('fs');

module.exports = function Test (setup, test) {

   let context = {
      root: FS.mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-'),
      git: require('../../../'),
      gitP: require('../../../promise'),
      deferred: function () {
         let d = {};
         d.promise = new Promise((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
         });

         return d;
      }
   };

   this.setUp = function (done) {
      Promise.resolve(context)
         .then(setup)
         .then(() => {
            done()
         });
   };

   this.tearDown = function (done) {
      done();
   };

   this.test = function (runner) {
      const done = (result) => {
         if (result && result.message) {
            runner.ok(false, result.message);
         }

         runner.done();
      };

      Promise.resolve()
         .then(() => test(context, runner))
         .then(done, done);
   };
};
