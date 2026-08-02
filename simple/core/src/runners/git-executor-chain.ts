import { GitError } from '../errors';
import type { OutputLogger } from '../git-logger';
import type { TaskPipeline } from '../pipeline/pipeline';
import type { GitBinary, TaskContext } from '../pipeline/types';
import {
   type EmptyTask,
   type GitTask,
   isBufferTask,
   isEmptyTask,
   type RunnableTask,
} from '../tasks';
import type { GitExecutorEnv, GitExecutorResult, SimpleGitExecutor } from '../types';
import { callTaskParser, first, GitOutputStreams, objectToString } from '../utils';
import type { GitExecutor } from './git-executor';
import type { Scheduler } from './scheduler';
import { TasksPendingQueue } from './tasks-pending-queue';
import { executeRemoteTask } from './execute-remote-task';

export class GitExecutorChain implements SimpleGitExecutor {
   private _chain: Promise<any> = Promise.resolve();
   private _queue = new TasksPendingQueue();
   private _cwd: string | undefined;

   public get cwd(): string {
      return this._cwd || this._executor.cwd;
   }

   public set cwd(cwd: string) {
      this._cwd = cwd;
   }

   public get env(): GitExecutorEnv {
      return this._executor.env;
   }

   public set env(env) {
      this._executor.env = env;
   }

   public get binary(): GitBinary {
      return this._executor.binary;
   }

   public set binary(binary) {
      this._executor.binary = binary;
   }

   constructor(
      private _executor: GitExecutor,
      private _scheduler: Scheduler,
      private _pipeline: TaskPipeline
   ) {}

   public chain(): this {
      return this;
   }

   public push<R>(task: GitTask<R>): Promise<R> {
      this._queue.push(task);

      return (this._chain = this._chain.then(() => this.attemptTask(task)));
   }

   private async attemptTask<R>(task: GitTask<R>): Promise<void | R> {
      const onScheduleComplete = await this._scheduler.next();
      const onQueueComplete = () => this._queue.complete(task);

      try {
         const { logger } = this._queue.attempt(task);
         return (await (isEmptyTask(task)
            ? this.attemptEmptyTask(task, logger)
            : this.attemptRemoteTask(task, logger))) as R;
      } catch (e) {
         throw this.onFatalException(task, e as Error);
      } finally {
         onQueueComplete();
         onScheduleComplete();
      }
   }

   private onFatalException<R>(task: GitTask<R>, e: Error) {
      const gitError =
         e instanceof GitError ? Object.assign(e, { task }) : new GitError(task, e && String(e));

      this._chain = Promise.resolve();
      this._queue.fatal(gitError);

      return gitError;
   }

   private async attemptRemoteTask<R>(task: RunnableTask<R>, logger: OutputLogger) {
      const { binary, prefix } = this._pipeline.binary(
         { ...this._executor.binary },
         this.taskContext(task, task.commands)
      );
      const args = this._pipeline.args([...task.commands], this.taskContext(task, task.commands));
      const argv = [...prefix, ...args];

      const raw = await this.gitResponse(task, binary, argv, logger.step('SPAWN'));
      const outputStreams = await this.handleTaskData(task, argv, raw, logger.step('HANDLE'));

      logger(`passing response to task's parser as a %s`, task.format);

      if (isBufferTask(task)) {
         return callTaskParser(task.parser, outputStreams);
      }

      return callTaskParser(task.parser, outputStreams.asStrings());
   }

   private async attemptEmptyTask(task: EmptyTask, logger: OutputLogger) {
      logger(`empty task bypassing child process to call to task's parser`);
      return task.parser(this);
   }

   private handleTaskData<R>(
      task: GitTask<R>,
      args: string[],
      result: GitExecutorResult,
      logger: OutputLogger
   ): Promise<GitOutputStreams> {
      const { exitCode, rejection, stdOut, stdErr } = result;

      return new Promise((done, fail) => {
         logger(`Preparing to handle process response exitCode=%d stdOut=`, exitCode);

         const error = this._pipeline.onError(rejection, result, this.taskContext(task, args));

         if (error && task.onError) {
            logger.info(`exitCode=%s handling with custom error handler`);

            return task.onError(
               result,
               error,
               (newStdOut) => {
                  logger.info(`custom error handler treated as success`);
                  logger(`custom error returned a %s`, objectToString(newStdOut));

                  done(
                     new GitOutputStreams(
                        Array.isArray(newStdOut) ? Buffer.concat(newStdOut) : newStdOut,
                        Buffer.concat(stdErr)
                     )
                  );
               },
               fail
            );
         }

         if (error) {
            logger.info(
               `handling as error: exitCode=%s stdErr=%s rejection=%o`,
               exitCode,
               stdErr.length,
               rejection
            );
            return fail(error);
         }

         logger.info(`retrieving task output complete`);
         done(new GitOutputStreams(Buffer.concat(stdOut), Buffer.concat(stdErr)));
      });
   }

   private async gitResponse<R>(
      task: GitTask<R>,
      command: string,
      args: string[],
      logger: OutputLogger
   ): Promise<GitExecutorResult> {
      return executeRemoteTask<R>(
         task,
         command,
         args,
         this._pipeline,
         this.taskContext(task, args),
         this.cwd,
         { ...process.env, ...this.env },
         logger
      );
   }

   private taskContext<R>(task: GitTask<R>, commands: string[]): TaskContext {
      return {
         method: String(first(task.commands) || ''),
         commands,
         env: { ...this.env },
      };
   }
}
