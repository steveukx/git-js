(function () {
   'use strict';

   const { mockChildProcessModule, mockDebugModule, mockFileExistsModule } = require('../../helpers');
   const onRestore = [
      mockChildProcessModule.$reset,
      mockDebugModule.$reset,
      mockFileExistsModule.$reset,
   ];

   jest.mock('child_process', () => mockChildProcessModule);

   jest.mock('debug', () => mockDebugModule);

   jest.mock('@kwsites/file-exists', () => mockFileExistsModule);

   var git;

   function newSimpleGit (...args) {
      const simpleGit = require('../../..');
      return git = simpleGit(...args);
   }

   function instanceP (baseDir) {
      if (arguments.length > 0) {
         const str = (thing) => typeof thing === 'string' && thing || undefined;
         baseDir = str(baseDir) || str(arguments[arguments.length - 1]);
      }
      switch (arguments.length) {
         case 0: baseDir = __dirname; break;
         case 1: baseDir = typeof baseDir === 'string' ? baseDir : __dirname; break;
         case 2: baseDir = typeof baseDir === 'string' ? baseDir : __dirname; break;
      }
      return git = require('../../../promise')(baseDir);
   }

   function closeWith (data) {
      return childProcessEmits(
         'exit',
         typeof data !== 'number' ? data : null,
         typeof data === 'number' ? data : 0
      );

   }

   function theChildProcessMatching (what) {
      const match = mockChildProcessModule.$matchingChildProcess(what);

      if (!match) {
         throw new Error(`theChildProcessMatching unable to find matching child process ` + what);
      }

      return Object.create(match, {
         closeWithSuccess: { value: async function (data = '') {
            const isNum = typeof data === 'number';
            await processEmits(match, 'exit', isNum ? null : data, isNum ? data : 0);
            await wait();
         } }
      });
   }

   async function processEmits(proc, event, data, exitSignal) {
      if (typeof data === 'string') {
         data = Buffer.from(data);
      }

      proc[`called-${event}`] = true;
debugger;
      if (proc[event] && proc[event].on) {
         return proc[event].on.mock.calls[0][1](data);
      }

      if (Buffer.isBuffer(data)) {
         proc.stdout.on.mock.calls[0][1](data);
      }

      proc.on.mock.calls.forEach(function (handler) {
         debugger;
         if (handler[0] === event) {
            handler[1](exitSignal);
         }
      });
   }

   async function childProcessEmits (event, data, exitSignal) {
      await wait();
      const find = (event === 'exit') ? (p) => !p[`called-${event}`] : (p, i, a) => i === a.length - 1;
      const proc = mockChildProcessModule.$matchingChildProcess(find);

      if (!proc) {
         throw new Error(`Unable to find suitable mock child process for event=${event}, exitSignal=${exitSignal}`);
      }

      await processEmits(proc, event, data, exitSignal);
   }

   function errorWith (someMessage) {

      return new Promise(done => setTimeout(done, 10)).then(emit);

      function emit () {
         debugger;
         mockChildProcessModule.$mostRecent().$emit('error', {
            stack: someMessage
         });
      }

   }

   async function closeWithError(stack, code) {
      await errorWith(stack || 'CLOSING WITH ERROR');
      await closeWith(typeof code === 'number' ? code : 1);
   }

   async function closeWithSuccess (message) {
      await closeWith(message || '');
   }

   function theCommandRun () {
      return mockChildProcessModule.$mostRecent().$args;
   }

   function getCurrentMockChildProcess () {
      return mockChildProcessModule.$mostRecent();
   }

   function theEnvironmentVariables () {
      return mockChildProcessModule.$mostRecent().$env;
   }

   function wait (timeoutOrPromise) {
      if (timeoutOrPromise && typeof timeoutOrPromise === 'object' && typeof timeoutOrPromise.then === 'function') {
         return timeoutOrPromise.then(wait);
      }

      return new Promise(ok => setTimeout(ok, typeof timeoutOrPromise === 'number' ? timeoutOrPromise : 10));
   }

   module.exports = {
      childProcessEmits,
      closeWith,
      closeWithP: closeWith,
      closeWithError,
      closeWithSuccess,
      errorWith,
      Instance: newSimpleGit,
      instanceP,
      newSimpleGit,
      newSimpleGitP: instanceP,
      theCommandRun,
      theCommandsRun () {
         return mockChildProcessModule.$allCommands();
      },
      theChildProcessMatching,
      theEnvironmentVariables,
      getCurrentMockChildProcess,

      restore (sandbox) {
         git = null;

         sandbox?.restore();

         onRestore.forEach(tryCalling);
      },

      wait,
   };

   function tryCalling (what) {
      if (typeof what === 'function') {
         what();
      }
   }
}());
