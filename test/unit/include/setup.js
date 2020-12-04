(function () {

   const { mockChildProcessModule, mockDebugModule, wait } = require('../../helpers');
   const onRestore = [
      mockChildProcessModule.$reset,
      mockDebugModule.$reset,
   ];

   jest.mock('child_process', () => mockChildProcessModule);

   jest.mock('debug', () => mockDebugModule);

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
      if (proc[event] && proc[event].on) {
         return proc[event].on.mock.calls[0][1](data);
      }

      if (Buffer.isBuffer(data)) {
         proc.stdout.on.mock.calls[0][1](data);
      }

      proc.on.mock.calls.forEach(function (handler) {
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

   module.exports = {
      childProcessEmits,
      closeWithError,
      closeWithSuccess,
      theCommandRun,
      theCommandsRun () {
         return mockChildProcessModule.$allCommands();
      },
      theChildProcessMatching,

      restore (sandbox) {
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
