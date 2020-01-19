'use strict';

const FS = require('fs');
const PATH = require('path');

module.exports = function Test (setup, test) {

   let context = {
      dir (path) {
         const dir = PATH.join(context.root, path);
         if (!FS.existsSync(dir)) {
            FS.mkdirSync(dir);
         }

         return dir;
      },
      file (dir, path, content) {
         const file = PATH.join(context.dir(dir), path);
         FS.writeFileSync(file, content, 'utf8');

         return file;
      },
      filePath (dir, path) {
         return PATH.join(context.dir(dir), path);
      },
      root: FS.mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-'),
      get rootResolvedPath () {
         return FS.realpathSync(context.root);
      },
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
