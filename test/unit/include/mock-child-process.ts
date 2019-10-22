import { SinonSandbox } from 'sinon';

export class MockChildProcess {

   public childProcesses: any[] = [];
   public childProcess: any;

   constructor (
      private sandbox: SinonSandbox,
   ) {}

   spawn ($binary: string, $args: string[], $options: any) {
      const {sandbox} = this;
      const $events: { [key: string]: any[] } = {};

      const addEvent = (type: string, handler: any) => {
         ($events[type] = $events[type] || []).push(handler);
      };

      const runHandlers = (type: string, data: any) => {
         $events.hasOwnProperty(type) && $events[type].forEach(handler => handler(data));
      };

      return this.childProcess = this.childProcesses[this.childProcesses.length] = {
         $binary,
         $args,
         $options,

         $closeWith(data = '', exitCode = 0) {
            runHandlers('stdout', data);
            runHandlers('exit', exitCode);
         },

         on: sandbox.spy((event, handler) => addEvent(event, handler)),
         stdout: {on: sandbox.spy((type, handler) => addEvent('stdout', handler))},
         stderr: {on: sandbox.spy((type, handler) => addEvent('stderr', handler))},
      }
   }

   get $args (): string[] {
      if (!this.childProcess) {
         throw new Error('Attempted reading command arguments before any calls to ChildProcess.spawn have been made');
      }

      return this.childProcess && this.childProcess.$args;
   }

   $closeWith (data = '', exitCode = 0, index = 0) {
      if (index < 0 || index >= this.childProcesses.length) {
         throw new RangeError(`Unable to close child process with index ${index}`);
      }

      this.childProcesses[index].$closeWith(data, exitCode);
   }

}
