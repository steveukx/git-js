(function () {
   'use strict';

   var mockChildProcess, mockChildProcesses, git;
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

      concat () {}
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

      Object.defineProperty(this, 'asJestMock', { value: asJestMock });
   }

   function Instance (baseDir) {
      var Git = require('../../../src/git');

      var Buffer = MockBuffer;
      Buffer.concat = sinon.spy(function (things) {
         return {
            isBuffer: true,
            data: things,

            toString: sinon.spy(function () {
               return [].join.call(things, '\n');
            })
         };
      });

      return git = new Git(baseDir, mockChildProcess || new MockChildProcess, Buffer);
   }

   function instanceP (sandbox, baseDir) {
      const dependencies = require('../../../src/util/dependencies');

      sandbox.stub(dependencies, 'childProcess').returns(new MockChildProcess());
      sandbox.stub(dependencies, 'buffer').returns(mockBufferFactory(sandbox));

      return git = require('../../../promise')(baseDir);
   }

   function hasQueuedTasks () {
      return git._runCache.length > 0;
   }

   function closeWith (data) {
      return childProcessEmits(
         'exit',
         typeof data !== 'number' ? data : null,
         typeof data === 'number' ? data : 0
      );
   }

   function closeWithP (data) {
      return new Promise(done => setTimeout(() => done(closeWith(Buffer.from(data))), 10));
   }

   function childProcessEmits (event, data, exitSignal) {
      var proc = mockChildProcesses[mockChildProcesses.length - 1];

      if (proc[event] && proc[event].on) {
         return Promise.resolve(proc[event].on.args[0][1](data));
      }

      if (typeof data === "string" || Buffer.isBuffer(data)) {
         proc.stdout.on.args[0][1](data);
      }

      proc.on.args.forEach(function (handler) {
         if (handler[0] === event) {
            handler[1](exitSignal);
         }
      });

      return Promise.resolve();
   }

   function errorWith (someMessage) {
      var handlers = mockChildProcesses[mockChildProcesses.length - 1].on.args;
      handlers.forEach(function (handler) {
         if (handler[0] === 'error') {
            handler[1]({
               stack: someMessage
            });
         }
      });
   }

   function theCommandRun () {
      return mockChildProcess.spawn.args[0][1];
   }

   function getCurrentMockChildProcess() {
      return mockChildProcess;
   }

   function theEnvironmentVariables () {
      return mockChildProcess.spawn.args[0][2].env;
   }

   module.exports = {
      childProcessEmits,
      closeWith,
      closeWithP,
      errorWith,
      hasQueuedTasks,
      Instance,
      instanceP,
      MockBuffer,
      MockChildProcess,
      theCommandRun,
      theEnvironmentVariables,
      getCurrentMockChildProcess,

      restore (sandbox) {
         git = null;

         if (mockChildProcess && !mockChildProcess.asJestMock) {
            mockChildProcess = null;
         }

         mockChildProcesses = [];

         if (sandbox) {
            sandbox.restore();
         }
      }
   };

}());
