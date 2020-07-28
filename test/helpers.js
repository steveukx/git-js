import { promiseResult, promiseError } from '@kwsites/promise-result';

const helpers = Object.assign(module.exports, {
   assertGitError,
   assertExecutedCommands,
   autoMergeConflict,
   autoMergeFile,
   autoMergeResponse,
   configureGitCommitter,
   createFixture,
   createSingleConflict,
   createTestContext,
   like,
   mockChildProcessModule: mockChildProcessModule(),
   promiseError,
   promiseResult,
   setUpConflicted,
   setUpFilesAdded,
   setUpFilesCreated,
   setUpGitIgnore,
   setUpInit,
   wait,
});

function createFixture (stdOut, stdErr) {
   return {
      stdOut,
      stdErr,
      parserArgs: [stdOut, stdErr],
   };
}

function like (what) {
   return expect.objectContaining(what);
}

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

async function setUpConflicted (context) {
   await setUpInit(context);
   const git = context.git(context.root);
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
   await setUpFilesCreated(context, fileNames);

   const git = context.git(context.root);
   await git.add(addSelector);
   await git.commit(message);
}

async function setUpFilesCreated (context, fileNames) {
   await Promise.all(fileNames.map(name => context.fileP(name, `${ name }\n${ name }`)));
}

async function setUpGitIgnore (context, ignored = 'ignored.*\n') {
   await context.fileP('.gitignore', ignored);

   const git = context.git(context.root);
   await git.add('.gitignore');
   await git.commit('Add ignore');
}

async function setUpInit (context, bare = false) {
   await context.git(context.root).init(bare);
   await configureGitCommitter(context);
}

async function createSingleConflict (context) {
   const git = context.git(context.root);
   await git.checkout('first');
   await context.fileP('aaa.txt', 'Conflicting\nFile content\nhere');

   await git.add(`aaa.txt`);
   await git.commit('move first ahead of second');

   return 'second';
}

async function configureGitCommitter (context, name = 'Simple Git Tests', email = 'tests@simple-git.dev') {
   const git = context.git(context.root);
   await git.addConfig('user.name', name);
   await git.addConfig('user.email', email);
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
      dirPath (...dirs) {
         return join(context.root, ...dirs);
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

function assertExecutedCommands (...commands) {
   expect(helpers.mockChildProcessModule.$mostRecent().$args).toEqual(commands);
}

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

function wait (timeoutOrPromise) {
   if (timeoutOrPromise && typeof timeoutOrPromise === 'object' && typeof timeoutOrPromise.then === 'function') {
      return timeoutOrPromise.then(wait);
   }

   return new Promise(ok => setTimeout(ok, typeof timeoutOrPromise === 'number' ? timeoutOrPromise : 10));
}

class MockEventTarget {
   constructor () {
      const $handlers = this.$handlers = new Map();
      this.$emit = (ev, data) => getHandlers(ev).forEach(handler => handler(data));
      this.on = jest.fn((ev, handler) => addHandler(ev, handler));

      function addHandler (ev, handler) {
         const handlers = $handlers.get(ev) || [];
         handlers.push(handler);
         $handlers.set(ev, handlers)
      }
      function getHandlers (ev) {
         return $handlers.get(ev) || [];
      }
   }
}

class MockChildProcess extends MockEventTarget {
   constructor ([$command, $args, $options]) {
      super();

      Object.assign(this, {$command, $args, $options, $env: $options && $options.env});
      this.stdout = new MockEventTarget();
      this.stderr = new MockEventTarget();
   }
}

function mockChildProcessModule () {

   const children = [];

   return {
      spawn: jest.fn((...args) => addChild(new MockChildProcess(args))),

      $allCommands () {
         return children.map(child => child.$args);
      },

      $mostRecent () {
         return children[children.length - 1];
      },

      $matchingChildProcess (what) {
         if (Array.isArray(what)) {
            return children.find(proc =>
               JSON.stringify(proc.$args) === JSON.stringify(what));
         }
         if (typeof what === "function") {
            return children.find(what);
         }

         throw new Error('$matchingChildProcess needs either an array of commands or matcher function');
      },

      $reset () {
         children.length = 0;
      },
   };

   function addChild (child) {
      return children[children.length] = child;
   }
}
