import { spawn } from 'node:child_process';

import { GitError } from '../errors/git-error';
import { TaskConfigurationError } from '../errors/task-configuration-error';
import type { TaskOptions, VariadicOptions } from '../options/options.types';
import { asTaskOptions } from '../options/task-options';
import type { PluginStore } from '../plugins/plugin-store';
import { ExitCodes } from '../task/exit-codes';
import { isBufferTask, isEmptyTask, stringTask } from '../task/task';
import type { BufferTask, GitTask, StringTask } from '../task/task.types';
import type { OutputHandler, SimpleGitOptions, SpawnResult } from './executor.types';

/**
 * The executor surface: the genuinely stateful parts that are not "spawn one
 * command". Tasks are executor-agnostic descriptors; the executor knows how to
 * run them (`run`/`raw`/`stream`) and carries the mutable spawn configuration
 * (`cwd`/`env`/`outputHandler`/`customBinary`).
 */
export class GitExecutor {
   private _env?: NodeJS.ProcessEnv;
   private _outputHandler?: OutputHandler;
   private _binary: string;
   private _baseDir: string;

   constructor(
      options: SimpleGitOptions,
      private readonly plugins: PluginStore
   ) {
      this._binary = options.binary;
      this._baseDir = options.baseDir;
   }

   get baseDir(): string {
      return this._baseDir;
   }

   // --- bespoke, executor-mutating methods (not descriptors) ------------------

   cwd(dir: string): this {
      this._baseDir = dir;
      return this;
   }

   env(name: string, value: string): this;
   env(env: NodeJS.ProcessEnv): this;
   env(name: string | NodeJS.ProcessEnv, value?: string): this {
      this._env = typeof name === 'string' ? { ...(this._env ?? {}), [name]: value } : { ...name };
      return this;
   }

   outputHandler(handler: OutputHandler): this {
      this._outputHandler = handler;
      return this;
   }

   customBinary(binary: string): this {
      this._binary = binary;
      return this;
   }

   // --- execution -------------------------------------------------------------

   /**
    * Runs the supplied tasks in series, resolving with the *last* task's parsed
    * response. Leading tasks run for their side effects; calling with no task is
    * a compile error (and throws at runtime as a safety net).
    */
   run<R>(...tasks: [...GitTask<unknown>[], GitTask<R>]): Promise<R>;
   async run(...tasks: GitTask<unknown>[]): Promise<unknown> {
      if (!tasks.length) {
         throw new TaskConfigurationError('git.run requires at least one task');
      }

      let result: unknown;
      for (const task of tasks) {
         result = await this.runTask(task);
      }
      return result;
   }

   /**
    * Normalises a descriptor, a string[], varargs strings, and/or a trailing
    * options object into a single command and resolves git's output as a string.
    */
   raw(task: GitTask<unknown>): Promise<string>;
   raw(...commands: Array<string | TaskOptions>): Promise<string>;
   async raw(...args: Array<string | TaskOptions | GitTask<unknown>>): Promise<string> {
      if (args.length === 1 && isGitTask(args[0])) {
         return this.runTask(args[0]) as Promise<string>;
      }

      const commands = asTaskOptions(args as VariadicOptions);
      if (!commands.length) {
         throw new TaskConfigurationError('git.raw requires at least one command');
      }

      return this.runTask(stringTask(commands));
   }

   /**
    * Spawns the task and resolves an async iterator over the raw stdout `Buffer`
    * chunks. The deny-by-default guards still apply, so a blocked task rejects
    * the returned promise before any chunk is produced.
    */
   async stream(task: GitTask<unknown>): Promise<AsyncIterableIterator<Buffer>> {
      const { binary, args, options } = this.prepareSpawn(task);
      const child = spawn(binary, toStringArgs(args), options);
      if (!child.stdout) {
         throw new GitError(task, 'git.stream: child process produced no stdout stream');
      }
      return child.stdout[Symbol.asyncIterator]() as AsyncIterableIterator<Buffer>;
   }

   // --- internals -------------------------------------------------------------

   private async runTask<R>(task: GitTask<R>): Promise<R> {
      if (isEmptyTask(task)) {
         return task.parser();
      }

      const { binary, args, options } = this.prepareSpawn(task);
      const result = await this.spawnGit(binary, args, options);
      return this.handleResult(task, result);
   }

   private prepareSpawn(task: GitTask<unknown>) {
      const context = {
         method: task.commands[0] ?? '',
         commands: [...task.commands],
         env: this._env,
      };

      const binary = this.plugins.exec('spawn.binary', this._binary, context);
      const args = this.plugins.exec('spawn.args', [...task.commands], context);
      const options = this.plugins.exec(
         'spawn.options',
         { cwd: this._baseDir, env: { ...process.env, ...this._env }, windowsHide: true },
         context
      );

      return { binary, args, options };
   }

   private spawnGit(
      binary: string,
      args: string[],
      options: { cwd: string; env: NodeJS.ProcessEnv }
   ): Promise<SpawnResult> {
      return new Promise((resolve) => {
         const stdOut: Buffer[] = [];
         const stdErr: Buffer[] = [];
         const child = spawn(binary, toStringArgs(args), { ...options, windowsHide: true });

         child.stdout?.on('data', (chunk: Buffer) => stdOut.push(chunk));
         child.stderr?.on('data', (chunk: Buffer) => stdErr.push(chunk));

         if (this._outputHandler && child.stdout && child.stderr) {
            this._outputHandler(binary, child.stdout, child.stderr, toStringArgs(args));
         }

         child.on('error', (rejection) =>
            resolve({ stdOut, stdErr, exitCode: ExitCodes.NOT_FOUND, rejection })
         );
         child.on('close', (exitCode) => resolve({ stdOut, stdErr, exitCode: exitCode ?? 0 }));
      });
   }

   private handleResult<R>(task: GitTask<R>, result: SpawnResult): Promise<R> | R {
      const { stdOut, stdErr, exitCode, rejection } = result;
      const stdErrBuffer = Buffer.concat(stdErr);
      const failed = Boolean(rejection) || exitCode !== ExitCodes.SUCCESS;

      if (failed) {
         const error =
            rejection ??
            new GitError(task, stdErrBuffer.toString('utf8') || `git exited with code ${exitCode}`);

         if (task.onError) {
            const onError = task.onError;
            return new Promise<R>((resolve, reject) => {
               onError(
                  { exitCode, stdOut: Buffer.concat(stdOut), stdErr: stdErrBuffer },
                  error,
                  (newStdOut) => resolve(parseTask(task, newStdOut, stdErrBuffer)),
                  reject
               );
            });
         }

         throw error;
      }

      return parseTask(task, Buffer.concat(stdOut), stdErrBuffer);
   }
}

function parseTask<R>(task: GitTask<R>, stdOut: Buffer, stdErr: Buffer): R {
   if (isBufferTask(task)) {
      return (task as BufferTask<R>).parser(stdOut, stdErr);
   }
   return (task as StringTask<R>).parser(stdOut.toString('utf8'), stdErr.toString('utf8'));
}

function isGitTask(value: unknown): value is GitTask<unknown> {
   return (
      typeof value === 'object' &&
      value !== null &&
      'commands' in value &&
      'format' in value &&
      'parser' in value
   );
}

function toStringArgs(args: string[]): string[] {
   return args.map((arg) => String(arg));
}
