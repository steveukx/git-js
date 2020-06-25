(function () {
   'use strict';

   const { mockDebugModule, mockFileExistsModule } = require('../../helpers');
   const onRestore = [
      mockDebugModule.$reset,
      mockFileExistsModule.$reset,
   ];

   jest.mock('child_process', () => {
      return new MockChildProcess(true);
   });

   jest.mock('debug', () => mockDebugModule);

   jest.mock('@kwsites/file-exists', () => mockFileExistsModule);

   var mockChildProcess, mockChildProcesses = [], git;
   var sinon = require('sinon');

   function MockChild () {
      mockChildProcesses.push(this);
      this.stdout = {
         on: sinon.spy()
      };
      this.stderr = {
         on: sinon.spy()
      };
      this.on = sinon.spy();
   }

   function MockChildProcess (asJestMock = false) {
      mockChildProcess = this;

      this.spawn = sinon.spy(function ($command, $args, $options) {
         return Object.assign(new MockChild(), {$command, $args, $options});
      });

      Object.defineProperty(this, 'asJestMock', {value: asJestMock});
   }

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
      let match;
      if (Array.isArray(what)) {
         match = mockChildProcesses.find(proc =>
            JSON.stringify(proc.$args) === JSON.stringify(what));
      }
      else if (typeof what === "function") {
         match = mockChildProcesses.find(what);
      }
      else {
         throw new Error('theChildProcessMatching needs either an array of commands or matcher function');
      }

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

      if (proc[event] && proc[event].on) {
         return proc[event].on.args[0][1](data);
      }

      if (Buffer.isBuffer(data)) {
         proc.stdout.on.args[0][1](data);
      }

      proc.on.args.forEach(function (handler) {
         if (handler[0] === event) {
            handler[1](exitSignal);
         }
      });
   }

   async function childProcessEmits (event, data, exitSignal) {
      await wait();
      const find = (event === 'exit') ? (p) => !p[`called-${event}`] : (p, i, a) => i === a.length - 1;
      const proc = mockChildProcesses.find(find);

      if (!proc) {
         throw new Error(`Unable to find suitable mock child process for event=${event}, exitSignal=${exitSignal}`);
      }

      await processEmits(proc, event, data, exitSignal);
   }

   function errorWith (someMessage) {

      return new Promise(done => setTimeout(done, 10)).then(emit);

      function emit () {
         var handlers = mockChildProcesses[mockChildProcesses.length - 1].on.args;
         handlers.forEach(function (handler) {
            if (handler[0] === 'error') {
               handler[1]({
                  stack: someMessage
               });
            }
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
      return mockChildProcess.spawn.args[0][1];
   }

   function getCurrentMockChildProcess () {
      return mockChildProcess;
   }

   function theEnvironmentVariables () {
      return mockChildProcess.spawn.args[0][2].env;
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
      MockChildProcess,
      theCommandRun,
      theCommandsRun () {
         return mockChildProcess.spawn.args.map(([binary, commands]) => commands);
      },
      theChildProcessMatching,
      theEnvironmentVariables,
      getCurrentMockChildProcess,

      restore (sandbox) {
         git = null;

         if (mockChildProcess && !mockChildProcess.asJestMock) {
            mockChildProcess = null;
         }
         else if (mockChildProcess) {
            mockChildProcess.spawn.resetHistory();
         }

         mockChildProcesses = [];

         if (sandbox) {
            sandbox.restore();
         }

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
