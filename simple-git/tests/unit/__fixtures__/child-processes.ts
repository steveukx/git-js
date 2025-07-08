import { MockChildProcess, mockChildProcessModule } from '../__mocks__/mock-child-process';
import { wait } from '@simple-git/test-utils';

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_ERROR = 1;

export async function writeToStdErr(data = '') {
   await wait();
   const proc = mockChildProcessModule.$mostRecent();

   if (!proc) {
      throw new Error(`writeToStdErr unable to find matching child process`);
   }

   if (proc.$emitted('exit')) {
      throw new Error('writeToStdErr: attempting to write to an already closed process');
   }

   proc.stderr.$emit('data', Buffer.from(data));
}

export async function writeToStdOut(data = '') {
   await wait();
   const proc = mockChildProcessModule.$mostRecent();

   if (!proc) {
      throw new Error(`writeToStdOut unable to find matching child process`);
   }

   if (proc.$emitted('exit')) {
      throw new Error('writeToStdOut: attempting to write to an already closed process');
   }

   proc.stdout.$emit('data', Buffer.from(data));
}

export async function closeWithError(stack = 'CLOSING WITH ERROR', code = EXIT_CODE_ERROR) {
   await wait();
   const match = mockChildProcessModule.$mostRecent();

   match.$emit('error', { stack });
   await exitChildProcess(match, null, code);
   await wait();
}

export async function closeWithSuccess(message = '') {
   await wait();
   const match = mockChildProcessModule.$matchingChildProcess((p) => !p.$emitted('exit'));
   if (!match) {
      throw new Error(`closeWithSuccess unable to find matching child process`);
   }

   await exitChildProcess(match, message, EXIT_CODE_SUCCESS);
   await wait();
}

export function theChildProcess() {
   if (mockChildProcessModule.$count() !== 1) {
      throw new Error(
         `theChildProcess helper found ${mockChildProcessModule.$count()} child processes`
      );
   }

   return mockChildProcessModule.$mostRecent();
}

export function theChildProcessMatching(what: string[] | ((mock: MockChildProcess) => boolean)) {
   const match = mockChildProcessModule.$matchingChildProcess(what);

   if (!match) {
      throw new Error(`theChildProcessMatching unable to find matching child process ` + what);
   }

   return Object.create(match, {
      closeWithSuccess: {
         value: async function (message = '') {
            await exitChildProcess(match, message, EXIT_CODE_SUCCESS);
            await wait();
         },
      },
   });
}

async function exitChildProcess(proc: MockChildProcess, data: string | null, exitSignal: number) {
   if (proc.$emitted('exit')) {
      throw new Error('exitChildProcess: attempting to exit an already closed process');
   }

   if (typeof data === 'string') {
      proc.stdout.$emit('data', Buffer.from(data));
   }

   // exit/close events are bound to the process itself
   proc.$emit('exit', exitSignal);
   proc.$emit('close', exitSignal);
}
