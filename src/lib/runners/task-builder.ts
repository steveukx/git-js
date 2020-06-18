import { GitExecutor } from '../git-executor';
import { execTask, SimpleGitTask } from '../tasks/task';
import { Options, outputHandler, SimpleGitTaskCallback } from '../types';
import { folderExists, getTrailingOptions, isUserFunction, NOOP, trailingFunctionArgument } from '../utils';
import { taskCallback } from '../task-callback';
import { addRemoteTask } from '../tasks/remote';
import { GitError } from '../errors/git-error';

export type SimpleGitTaskTrailingCallback<R> = [SimpleGitTaskCallback<R>] | [];

export type SimpleGitTaskTrailingOptions<R, OPT = Options> =
   [OPT, SimpleGitTaskCallback<R>] |
   [string[], SimpleGitTaskCallback<R>] |
   [OPT] |
   [string[]] |
   SimpleGitTaskTrailingCallback<R>;

export class TaskBuilder {

   private _promise: Promise<any> = Promise.resolve();

   constructor(
      private _executor: GitExecutor,
   ) {
   }

   /**
    * Sets the path to a custom git binary, should either be `git` when there is an installation of git available on
    * the system path, or a fully qualified path to the executable.
    */
   public customBinary (command: string): this {
      this._executor.binary = command;
      return this;
   }

   /**
    * * Sets an environment variable for the spawned child process, either supply both a name and value as strings or
    * a single object to entirely replace the current environment variables.
    */
   public env (name: string, value: string): this;
   public env (...env: [string, string] | [Options]): this {
      if (env.length == 1) {
         this._executor.env = typeof env[0] === 'object' && env[0] || undefined;
      }
      else if (env.length === 2) {
         (this._executor.env = this._executor.env || {})[env[0]] = env[1];
      }
      return this;
   }

   /**
    * Sets the working directory of the subsequent commands.
    */
   public cwd (workingDirectory: string, ...opt: SimpleGitTaskTrailingCallback<string>): this {
      return this._runTask(
         execTask(() => {
            if (!folderExists(workingDirectory)) {
               throw new GitError(undefined, `Git.cwd: cannot change to non-directory "${workingDirectory}"`);
            }

            return this._executor.cwd = workingDirectory;
         }),
         trailingFunctionArgument(opt),
      )
   }

   public addRemote(remoteName: string, remoteRepo: string, ...opt: SimpleGitTaskTrailingOptions<string>): this {
      return this._runTask(
         addRemoteTask(remoteName, remoteRepo, getTrailingOptions(opt)),
         trailingFunctionArgument(opt),
      );
   }

   public outputHandler (handler: outputHandler): this {
      this._executor.outputHandler = handler;
      return this;
   }

   private _runTask<R>(task: SimpleGitTask<R>, callback: SimpleGitTaskCallback<R> = NOOP): this {
      this._promise = this._executor.push(task);

      if (isUserFunction(callback)) {
         taskCallback(task, this._promise, callback);
      }

      return this;
   }
}
