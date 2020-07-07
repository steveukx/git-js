import { promiseResult, promiseError } from '@kwsites/promise-result';

Object.assign(module.exports, {
   assertGitError,
   autoMergeConflict,
   autoMergeFile,
   autoMergeResponse,
   createSingleConflict,
   createTestContext,
   promiseError,
   promiseResult,
   setUpConflicted,
   setUpFilesAdded,
   setUpGitIgnore,
   setUpInit,
});

function autoMergeFile (fileName = 'pass.txt') {
   return `
Auto-merging ${ fileName }`;
}

function autoMergeConflict (fileName = 'fail.txt', reason = 'content') {
   return `
Auto-merging ${ fileName }
CONFLICT (content): Merge conflict in ${ fileName }`;
}

function autoMergeResponse (...responses) {
   let response = responses.map(r => typeof r === 'function' ? r() : String(r)).join('');
   if (/^CONFLICT/.test(response)) {
      response += `\nAutomatic merge failed; fix conflicts and then commit the result.`;
   }

   return response;
}

async function setUpConflicted (git, context) {
   await git.init();
   await git.checkout(['-b', 'first']);

   await context.fileP('aaa.txt', 'Some\nFile content\nhere');
   await context.fileP('bbb.txt', Array.from({length: 20}, () => 'bbb').join('\n'));

   await git.add(`*.txt`);
   await git.commit('first commit');
   await git.checkout(['-b', 'second', 'first']);

   await context.fileP('aaa.txt', 'Different\nFile content\nhere');
   await context.fileP('ccc.txt', 'Another file');

   await git.add(`*.txt`);
   await git.commit('second commit');
}

async function setUpFilesAdded (context, fileNames, addSelector = '.', message = 'Create files') {
   await Promise.all(fileNames.map(name => context.fileP(name, `${ name }\n${ name }`)));

   const git = context.git(context.root);
   await git.add(addSelector);
   await git.commit(message);
}

async function setUpGitIgnore (context, ignored = 'ignored.*\n') {
   await context.fileP('.gitignore', ignored);

   const git = context.git(context.root);
   await git.add('.gitignore');
   await git.commit('Add ignore');
}

async function setUpInit (context, bare = false) {
   await context.git(context.root).init(bare);
}

async function createSingleConflict (git, context) {
   await git.checkout('first');
   await context.fileP('aaa.txt', 'Conflicting\nFile content\nhere');

   await git.add(`aaa.txt`);
   await git.commit('move first ahead of second');

   return 'second';
}

function createTestContext () {
   const {join} = require('path');
   const {existsSync, mkdirSync, mkdtempSync, realpathSync, writeFile, writeFileSync} = require('fs');

   const context = {
      dir (...paths) {
         if (!paths.length) {
            return context.root;
         }

         const dir = join(context.root, ...paths);
         if (!existsSync(dir)) {
            mkdirSync(dir);
         }

         return dir;
      },
      fileP (dir, path, content) {
         if (arguments.length === 2) {
            return context.fileP(undefined, dir, path);
         }

         return new Promise((ok, fail) => {
            const file = join(dir ? context.dir(dir) : context.root, path);
            writeFile(file, content, (err) => err ? fail(err) : ok(file));
         });
      },
      file (dir, path, content) {
         const file = join(dir ? context.dir(dir) : context.root, path);
         writeFileSync(file, content, 'utf8');

         return file;
      },
      filePath (dir, path) {
         return join(context.dir(dir), path);
      },
      root: mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-'),
      get rootResolvedPath () {
         return realpathSync(context.root);
      },
      git: require('../'),
      gitP: require('../promise'),
      deferred () {
         let d = {};
         d.promise = new Promise((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
         });

         return d;
      }
   };

   return context;
}

module.exports.mockDebugModule = (function mockDebugModule () {

   process.env.DEBUG_COLORS = false;

   const output = [];
   const debug = jest.requireActual('debug');
   const {enable, disable} = debug;

   debug.log = (format) => {
      const [time, namespace, ...message] = format.split(' ');
      output.push({
         time, namespace, message: message.join(' '),
      });
   };

   jest.spyOn(debug, 'enable');
   jest.spyOn(debug, 'disable');

   debug.$setup = (enabled) => {
      if (!enabled) {
         disable.call(debug);
      } else {
         enable.call(debug, enabled);
      }

      debug.enable.mockReset();
      debug.disable.mockReset();
   };

   debug.$logged = () => output.reduce((all, {namespace, message}) => {
      (all[namespace] = all[namespace] || {
         get count () {
            return this.messages.length;
         },
         messages: [],
         toString () {
            return this.messages.join('\n');
         }
      }).messages.push(message);
      return all;
   }, {});

   debug.$output = (namespace) => {
      return output.filter(entry => {
         return !namespace || entry.namespace === namespace;
      });
   };

   debug.$reset = () => {
      output.length = 0;
      debug.$setup();

      const {TasksPendingQueue} = require('../src/lib/runners/tasks-pending-queue');
      TasksPendingQueue.counter = 0;
   };

   debug.$setup();

   return debug;

}());

module.exports.mockFileExistsModule = (function mockFileExistsModule () {
   let next = true;

   return {
      $fails () {
         next = false;
      },
      $reset () {
         next = true;
      },
      exists () {
         return next;
      },
      FOLDER: 2,
   };
}());

/**
 * Convenience for asserting the type and message of a `GitError`
 *
 * ```javascript
 const promise = doSomethingAsyncThatRejects();
 const {threw, error} = await promiseError(git.init());

 expect(threw).toBe(true);
 assertGitError(error, 'some message');
 ```
 */
function assertGitError (errorInstance, message, errorConstructor) {
   if (!errorConstructor) {
      errorConstructor = require('..').GitError;
   }

   expect(errorInstance).toBeInstanceOf(errorConstructor);
   expect(errorInstance).toHaveProperty('message', expect.any(String));
   expect(errorInstance.message).toMatch(message);
}
