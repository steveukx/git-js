'use strict';

const FS = require('fs');

module.exports = function Test (setup, test) {

   let context = {
      root: FS.mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-'),
      git: require('../../../'),
      gitP: require('../../../promise')
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
      Promise.resolve()
         .then(() => test(context, runner))
         .then(() => {
            runner.done();
         });
   };
};
