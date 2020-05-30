'use strict';

const FS = require('fs');
const {join} = require('path');

module.exports = Test;

function Test (setup, test) {

   let context = Test.createContext();

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
}

Test.createContext = function () {
   const context = {
      dir (path) {
         const dir = join(context.root, path);
         if (!FS.existsSync(dir)) {
            FS.mkdirSync(dir);
         }

         return dir;
      },
      fileP (dir, path, content) {
         if (arguments.length === 2) {
            return context.fileP(undefined, dir, path);
         }

         return new Promise((ok, fail) => {
            const file = join(dir ? context.dir(dir) : context.root, path);
            FS.writeFile(file, content, (err) => err ? fail(err) : ok(file));
         });
      },
      file (dir, path, content) {
         if (arguments.length === 2) {
            throw new Error('BAD ARGS');
         }

         const file = join(dir ? context.dir(dir) : context.root, path);
         FS.writeFileSync(file, content, 'utf8');

         return file;
      },
      filePath (dir, path) {
         return join(context.dir(dir), path);
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

   return context;
};
