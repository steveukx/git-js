import { Context } from '../interfaces/context';
import { Task } from '../interfaces/task';
import { spawn } from 'child_process';
import { deferred } from './deferred';

export class Scheduler {

   constructor (
      private context: Context,
      private task: Task,
   ) {}

   async run (): Promise<string> {

      const [command, options] = this.task;

      // TODO: debug = require('debug')('simple-git');
      // debug(command);

      const result = deferred();

      let attempted = false;
      const attemptClose = (e: any) => {

         // closing when there is content, terminate immediately
         if (attempted || stdErr.length || stdOut.length) {
            result.resolve(e);
            attempted = true;
         }

         // first attempt at closing but no content yet, wait briefly for the close/exit that may follow
         if (!attempted) {
            attempted = true;
            setTimeout(() => attemptClose(e), 50);
         }

      };

      const stdOut: any[] = [];
      const stdErr: any[] = [];
      const spawned = spawn(this.context.command, command.map(String), {
         cwd: this.context.baseDir,
         env: this.context.env,
      });

      spawned.stdout.on('data', (buffer: any) => stdOut.push(buffer));

      spawned.stderr.on('data', (buffer: any) => stdErr.push(buffer));

      spawned.on('error', (err: Error) => stdErr.push(new Buffer(String(err.stack || err), 'ascii')));

      spawned.on('close', attemptClose);
      spawned.on('exit', attemptClose);

      result.promise.then(function (exitCode) {

         debugger;

         function done (output: any) {
            debugger;
            // then.call(git, null, output);
         }

         function fail (error: any) {
            debugger;
            // Git.fail(git, error, then);
         }

         if (exitCode && stdErr.length && options.onError) {
            options.onError(exitCode, Buffer.concat(stdErr).toString('utf-8'), done, fail);
         }
         else if (exitCode && stdErr.length) {
            fail(Buffer.concat(stdErr).toString('utf-8'));
         }
         else {
            if (options.concatStdErr) {
               stdOut.push(...stdErr);
            }

            const stdOutput = Buffer.concat(stdOut);

            done(options.format === 'buffer' ? stdOutput : stdOutput.toString(options.format || 'utf-8'));

         }

         // process.nextTick(git._schedule.bind(git));
      });

      if (this.context.outputHandler) {
         this.context.outputHandler(String(command[0]), spawned.stdout, spawned.stderr);
      }


      // TODO: this clearly doesn't work
      return 'HELLO';
   }

}
