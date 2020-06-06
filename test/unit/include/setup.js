(function () {
   'use strict';

   jest.mock('child_process', () => {
      return new MockChildProcess(true);
   });

   var mockChildProcess, mockChildProcesses = [], git;
   var sinon = require('sinon');

   const MockBuffer = {
      from (content, type) {
         return {
            type,
            toString () {
               return content;
            }
         }
      },

      concat () {
      }
   };

   function mockBufferFactory (sandbox) {
      const Buffer = sandbox.stub().throws(new Error('new Buffer() is fully deprecated'));
      Buffer.from = sandbox.spy();
      Buffer.concat = (things) => ({
         isBuffer: true,
         data: things,

         toString: sandbox.spy(() => [].join.call(things, '\n'))
      });

      return Buffer;
   }

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

      this.spawn = sinon.spy(function () {
         return new MockChild();
      });

      Object.defineProperty(this, 'asJestMock', {value: asJestMock});
   }

   function Instance (baseDir) {
      const simpleGit = require('../../..');
      return git = simpleGit(baseDir);
   }

   function instanceP (sandbox, baseDir) {
      const dependencies = require('../../../src/util/dependencies');

      sandbox.stub(dependencies, 'buffer').returns(mockBufferFactory(sandbox));

      return git = require('../../../promise')(baseDir);
   }

   function closeWith (data) {
      return childProcessEmits(
         'exit',
         typeof data !== 'number' ? data : null,
         typeof data === 'number' ? data : 0
      );

   }

   async function childProcessEmits (event, data, exitSignal) {
      await wait(10);

      if (typeof data === 'string') {
         data = Buffer.from(data);
      }

      const find = (event === 'exit') ? (p) => !p[`called-${event}`] : (p, i, a) => i === a.length - 1;
      const proc = mockChildProcesses.find(find);

      if (!proc) {
         throw new Error(`Unable to find suitable mock child process for event=${event}, exitSignal=${exitSignal}`);
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
      Instance,
      instanceP,
      MockBuffer,
      MockChildProcess,
      theCommandRun,
      theCommandsRun () {
         return mockChildProcess.spawn.args.map(([binary, commands]) => commands);
      },
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
      },

      wait,
   };

}());
