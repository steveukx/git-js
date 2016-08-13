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
      var Git = require('../../src/git');

      var Buffer = MockBuffer;
      Buffer.concat = sinon.spy(function (things) {
         return [].join.call(things, '\n');
      });

      return git = new Git(baseDir, new MockChildProcess, Buffer);
   }

   function closeWith (data) {
      if (typeof data === "string") {
         mockChildProcesses[mockChildProcesses.length - 1].stdout.on.args[0][1](data);
      }

      mockChildProcesses[mockChildProcesses.length - 1].on.args.forEach(function (handler) {
         if (handler[0] === 'close') {
            handler[1](typeof data === "number" ? data : 0);
         }
      });
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

   module.exports = {
      closeWith: closeWith,
      errorWith: errorWith,
      Instance: Instance,
      theCommandRun: theCommandRun,

      restore: function () {
         git = mockChildProcess = null;
         mockChildProcesses = [];
      }
   };

}());
