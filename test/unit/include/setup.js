(function () {
   'use strict';

   var mockChildProcess, mockChildProcesses, git;
   var sinon = require('sinon');

   function MockBuffer (content, type) {
      this.type = type;
      this.toString = function () {
         return content;
      }
   }

   MockBuffer.concat = function () {

   };

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

   function MockChildProcess () {
      mockChildProcess = this;
      this.spawn = sinon.spy(function () {
         return new MockChild();
      });
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

      return git = new Git(baseDir, new MockChildProcess, Buffer);
   }

   function hasQueuedTasks () {
      return git._runCache.length > 0;
   }

   function closeWith (data) {
      return childProcessEmits(
         'exit',
         typeof data === 'string' ? data : null,
         typeof data === 'number' ? data : 0
      );
   }

   function childProcessEmits (event, data, exitSignal) {
      var proc = mockChildProcesses[mockChildProcesses.length - 1];

      if (proc[event] && proc[event].on) {
         return Promise.resolve(proc[event].on.args[0][1](data));
      }

      if (typeof data === "string") {
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
      errorWith,
      hasQueuedTasks,
      Instance,
      MockBuffer,
      theCommandRun,
      theEnvironmentVariables,
      getCurrentMockChildProcess,

      restore: function () {
         git = mockChildProcess = null;
         mockChildProcesses = [];
      }
   };

}());
