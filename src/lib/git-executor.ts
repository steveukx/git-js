import ProcessEnv = NodeJS.ProcessEnv;
import { spawn, SpawnOptions } from 'child_process';

import { GitError } from './errors/git-error';
import { isBufferTask, isEmptyTask, SimpleGitTask } from './tasks/task';

export type GitExecutorEnv = ProcessEnv | undefined;

export type outputHandler = (
   command: string,
   stdout: NodeJS.ReadableStream,
   stderr: NodeJS.ReadableStream
) => void;

export interface GitExecutorResult {
   stdOut: Buffer[];
   stdErr: Buffer[];
   exitCode: number;
}

export class GitExecutor {

   private _chain: Promise<any> = Promise.resolve();

   constructor(
      public binary: string = 'git',
      public cwd: string,
      public env: GitExecutorEnv,
      public outputHandler: outputHandler,
   ) {
   }

   push<R>(task: SimpleGitTask<R>): Promise<void | R> {
      return this._chain = this._chain.then(async () => {

         try {
            if (isEmptyTask(task)) {
               return task.parser('');
            }

            const raw = await this.gitResponse(this.binary, task.commands, this.outputHandler);
            const data = await this.handleTaskData(task, raw);

            return isBufferTask(task) ? task.parser(data) : task.parser(data.toString(task.format));
         }

         catch (e) {
            this._chain = Promise.resolve();

            if (e instanceof GitError) {
               e.task = task;
               throw e;
            }

            throw new GitError(task, e && String(e));
         }

      });
   }

   private handleTaskData<R>({onError, concatStdErr}: SimpleGitTask<R>, {exitCode, stdOut, stdErr}: GitExecutorResult): Promise<Buffer> {
      return new Promise((done, fail) => {

         if (exitCode && stdErr.length && onError) {
            return onError(
               exitCode,
               Buffer.concat([...(concatStdErr ? stdOut : []), ...stdErr]).toString('utf-8'),
               (result: string | Buffer) => {
                  done(Buffer.from(Buffer.isBuffer(result) ? result : String(result)))
               },
               fail
            );
         }

         if (exitCode && stdErr.length) {
            return fail(Buffer.concat(stdErr).toString('utf-8'));
         }

         if (concatStdErr) {
            stdOut.push(...stdErr);
         }

         done(Buffer.concat(stdOut));
      });
   }

   private async gitResponse(command: string, args: string[], outputHandler?: outputHandler): Promise<GitExecutorResult> {
      const spawnOptions: SpawnOptions = {
         cwd: this.cwd,
         env: this.env,
         windowsHide: true,
      };

      return new Promise((done) => {
         const stdOut: Buffer[] = [];
         const stdErr: Buffer[] = [];

         let attempted = false;

         function attemptClose(exitCode: number) {

            // closing when there is content, terminate immediately
            if (attempted || stdErr.length || stdOut.length) {
               done({
                  stdOut,
                  stdErr,
                  exitCode,
               });
               attempted = true;
            }

            // first attempt at closing but no content yet, wait briefly for the close/exit that may follow
            if (!attempted) {
               attempted = true;
               setTimeout(() => attemptClose(exitCode), 50);
            }

         }

         const spawned = spawn(command, args, spawnOptions);

         spawned.stdout!.on('data', (buffer) => stdOut.push(buffer));
         spawned.stderr!.on('data', (buffer) => stdErr.push(buffer));

         spawned.on('error', (err: Error) => stdErr.push(Buffer.from(String(err.stack), 'ascii')));

         spawned.on('close', (code: number) => attemptClose(code));
         spawned.on('exit', attemptClose);

         if (outputHandler) {
            outputHandler(command[0], spawned.stdout!, spawned.stderr!);
         }

      });
   }


}

