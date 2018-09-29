import { spawn } from 'child_process';
import { RunnerResponseFormat } from '../constants/runner-response-format.enum';
import { Runner, RunnerOptions, RunnerResponse } from '../interfaces/command-runner';
import { writeLog } from '../util/output';

/**
 * The default Runner used by the library, works on the current directory using standard `git` as the binary name
 * with the same environment variables available to the calling script.
 */
export function defaultRunner(cwd: string, binary = 'git', env?: NodeJS.ProcessEnv): Runner {

   function run(commands: string[], options: RunnerOptions): Promise<RunnerResponse> {
      writeLog(`Starting runner: "${binary}" "{ commands.join('" "') }"`, 'runner');

      return new Promise((resolve, reject) => {
         let closed = false;
         const stdOut: Buffer[] = [];
         const stdErr: Buffer[] = [];

         const spawned = spawn(binary, commands, {
            cwd,
            env
         });

         spawned.stdout.on('data', function (buffer) {
            stdOut.push(buffer);
         });

         spawned.stderr.on('data', function (buffer) {
            stdErr.push(buffer);
         });

         spawned.on('error', function (err: Error) {
            stdErr.push(new Buffer(String(err.stack), 'ascii'));
         });

         spawned.on('close', onDone);
         spawned.on('exit', onDone);


         function onDone(exitCode: number) {
            if (closed) {
               return;
            }
            closed = true;

            writeLog(`Exit code ${ exitCode }`, 'runner');
            if (exitCode && stdErr.length && options.onError) {
               return options.onError(exitCode, Buffer.concat(stdErr).toString('utf-8'), resolve, reject);
            }

            if (exitCode && stdErr.length) {
               return reject(Buffer.concat(stdErr).toString('utf-8'));
            }

            if (options.concatStdErr) {
               stdOut.push(...stdErr);
            }

            writeLog(`Returning from runner`, 'runner');
            resolve(toResponseFormat(stdOut, options.format));

         }
      });
   }

   return {

      run

   }

}

/**
 * Coerces the child process `stdout` to the format expected by the requesting command
 */
export function toResponseFormat(stdOut: Buffer[], responseFormat: RunnerResponseFormat = RunnerResponseFormat.STRING): RunnerResponse {
   const stdOutput = Buffer.concat(stdOut);
   if (responseFormat === RunnerResponseFormat.BUFFER) {
      return stdOutput;
   }

   return Buffer.concat(stdOut).toString(responseFormat);
}

