import { spawn, SpawnOptions } from 'child_process';
import { GitError } from '../errors/git-error';
import { OutputLogger } from '../git-logger';
import { PluginStore } from '../plugins';
import { EmptyTask, isBufferTask, isEmptyTask } from '../tasks/task';
import {
   GitExecutorResult,
   Maybe,
   outputHandler,
   RunnableTask,
   SimpleGitExecutor,
   SimpleGitTask,
} from '../types';
import { callTaskParser, first, GitOutputStreams, objectToString } from '../utils';
import { Scheduler } from './scheduler';
import { TasksPendingQueue } from './tasks-pending-queue';

export class GitExecutorChain implements SimpleGitExecutor {
   private _chain: Promise<any> = Promise.resolve();
   private _queue = new TasksPendingQueue();
   private _cwd: string | undefined;

   public get cwd() {
      return this._cwd || this._executor.cwd;
   }

   public set cwd(cwd: string) {
      this._cwd = cwd;
   }

   public get env() {
      return this._executor.env;
   }

   public get outputHandler() {
      return this._executor.outputHandler;
   }

   constructor(
      private _executor: SimpleGitExecutor,
      private _scheduler: Scheduler,
      private _plugins: PluginStore
   ) {}

   public chain() {
      return this;
   }

   public push<R>(task: SimpleGitTask<R>): Promise<R> {
      this._queue.push(task);

      return (this._chain = this._chain.then(() => this.attemptTask(task)));
   }

   private async attemptTask<R>(task: SimpleGitTask<R>): Promise<void | R> {
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

   private onFatalException<R>(task: SimpleGitTask<R>, e: Error) {
      const gitError =
         e instanceof GitError ? Object.assign(e, { task }) : new GitError(task, e && String(e));

      this._chain = Promise.resolve();
      this._queue.fatal(gitError);

      return gitError;
   }

   private async attemptRemoteTask<R>(task: RunnableTask<R>, logger: OutputLogger) {
      const binary = this._plugins.exec('spawn.binary', '', pluginContext(task, task.commands));
      const args = this._plugins.exec(
         'spawn.args',
         [...task.commands],
         pluginContext(task, task.commands)
      );

      const raw = await this.gitResponse(
         task,
         binary,
         args,
         this.outputHandler,
         logger.step('SPAWN')
      );
      const outputStreams = await this.handleTaskData(task, args, raw, logger.step('HANDLE'));

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
      task: SimpleGitTask<R>,
      args: string[],
      result: GitExecutorResult,
      logger: OutputLogger
   ): Promise<GitOutputStreams> {
      const { exitCode, rejection, stdOut, stdErr } = result;

      return new Promise((done, fail) => {
         logger(`Preparing to handle process response exitCode=%d stdOut=`, exitCode);

         const { error } = this._plugins.exec(
            'task.error',
            { error: rejection },
            {
               ...pluginContext(task, args),
               ...result,
            }
         );

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
      task: SimpleGitTask<R>,
      command: string,
      args: string[],
      outputHandler: Maybe<outputHandler>,
      logger: OutputLogger
   ): Promise<GitExecutorResult> {
      const outputLogger = logger.sibling('output');
      const spawnOptions: SpawnOptions = this._plugins.exec(
         'spawn.options',
         {
            cwd: this.cwd,
            env: this.env,
            windowsHide: true,
         },
         pluginContext(task, task.commands)
      );

      return new Promise((done) => {
         const stdOut: Buffer[] = [];
         const stdErr: Buffer[] = [];

         logger.info(`%s %o`, command, args);
         logger('%O', spawnOptions);

         let rejection = this._beforeSpawn(task, args);
         if (rejection) {
            return done({
               stdOut,
               stdErr,
               exitCode: 9901,
               rejection,
            });
         }

         this._plugins.exec('spawn.before', undefined, {
            ...pluginContext(task, args),
            kill(reason) {
               rejection = reason || rejection;
            },
         });

         const spawned = spawn(command, args, spawnOptions);

         spawned.stdout!.on(
            'data',
            onDataReceived(stdOut, 'stdOut', logger, outputLogger.step('stdOut'))
         );
         spawned.stderr!.on(
            'data',
            onDataReceived(stdErr, 'stdErr', logger, outputLogger.step('stdErr'))
         );

         spawned.on('error', onErrorReceived(stdErr, logger));

         if (outputHandler) {
            logger(`Passing child process stdOut/stdErr to custom outputHandler`);
            outputHandler(command, spawned.stdout!, spawned.stderr!, [...args]);
         }

         this._plugins.exec('spawn.after', undefined, {
            ...pluginContext(task, args),
            spawned,
            close(exitCode: number, reason?: Error) {
               done({
                  stdOut,
                  stdErr,
                  exitCode,
                  rejection: rejection || reason,
               });
            },
            kill(reason: Error) {
               if (spawned.killed) {
                  return;
               }

               rejection = reason;
               spawned.kill('SIGINT');
            },
         });
      });
   }

   private _beforeSpawn<R>(task: SimpleGitTask<R>, args: string[]) {
      let rejection: Maybe<Error>;
      this._plugins.exec('spawn.before', undefined, {
         ...pluginContext(task, args),
         kill(reason) {
            rejection = reason || rejection;
         },
      });

      return rejection;
   }
}

function pluginContext<R>(task: SimpleGitTask<R>, commands: string[]) {
   return {
      method: first(task.commands) || '',
      commands,
   };
}

function onErrorReceived(target: Buffer[], logger: OutputLogger) {
   return (err: Error) => {
      logger(`[ERROR] child process exception %o`, err);
      target.push(Buffer.from(String(err.stack), 'ascii'));
   };
}

function onDataReceived(
   target: Buffer[],
   name: string,
   logger: OutputLogger,
   output: OutputLogger
) {
   return (buffer: Buffer) => {
      logger(`%s received %L bytes`, name, buffer);
      output(`%B`, buffer);
      target.push(buffer);
   };
}
