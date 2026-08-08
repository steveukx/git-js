import { registerBindings, type TaskMethods } from './bindings';
import { createBinaryConfig } from './custom-binary';
import { GitConstructError } from './errors';
import { createTaskPipeline } from './factory';
import { assertNoTrailingCallback } from './guards/assert-no-trailing-callback';
import { taskShapeError } from './guards/assert-task-shape';
import { trustedTask } from './guards/trusted-task';
import { createInstanceConfig } from './options';
import type { InitResult } from './responses';
import { getExecutor, setExecutor } from './runners/executor-cache';
import { GitExecutor } from './runners/git-executor';
import { chainedTask, runTask } from './runners/run-task';
import { Scheduler } from './runners/scheduler';
import {
   adhocExecTask,
   configurationErrorTask,
   type GitTask,
   initTask,
   isEmptyTask,
   isTaskDescriptor,
   type RunnableTask,
   straightThroughStringTask,
} from './tasks';
import { changeWorkingDirectoryTask } from './tasks/change-working-directory';
import type { Options, SimpleGitCoreOptions, TaskOptions } from './types';
import { createBufferQueue, filterPrimitives, folderExists, getTrailingOptions } from './utils';

/**
 * The return shape of every task method - both chainable (inherits the api,
 * with subsequent calls queued serially on the same executor chain) and
 * thenable (resolving with the task's parsed response).
 */
export type ChainedResponse<R> = SimpleGitCore & Promise<R>;

// Declaration merging is intentional: the generated sugar methods (add, commit,
// …) are installed on the prototype by registerBindings() and typed onto the
// class through this interface.
export interface SimpleGitCore extends TaskMethods {}

// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: sugar-method typing (see above)
export class SimpleGitCore {
   private readonly _trimmed: boolean;
   private readonly _allowUnsafeCustomBinary: boolean;

   constructor(options: Partial<SimpleGitCoreOptions> = {}) {
      const config = createInstanceConfig(options);

      if (!folderExists(config.baseDir)) {
         throw new GitConstructError(
            config,
            `Cannot use simple-git on a directory that does not exist`
         );
      }

      this._trimmed = config.trimmed;
      this._allowUnsafeCustomBinary = config.unsafe?.allowUnsafeCustomBinary === true;

      const executor = new GitExecutor(
         config.baseDir,
         new Scheduler(config.maxConcurrentProcesses),
         createTaskPipeline(config)
      );
      executor.binary = createBinaryConfig(config.binary, this._allowUnsafeCustomBinary);

      setExecutor(this, executor);
   }

   /**
    * Runs the supplied tasks in series through one executor chain, resolving
    * with the parsed response of the last task. Earlier tasks run for their
    * side effects; a failure in any task rejects the returned promise and
    * prevents the tasks after it from being attempted.
    */
   run<R>(...tasks: [...GitTask<unknown>[], GitTask<R>]): Promise<R> {
      assertNoTrailingCallback(tasks);

      if (!tasks.length) {
         return runTask<never>(
            this,
            configurationErrorTask('run: must supply one or more tasks to execute')
         );
      }

      // every task is vetted before any of them is queued - a bad descriptor
      // late in the list must not run the ones ahead of it first
      for (const task of tasks) {
         const invalid = taskShapeError(task);
         if (invalid) {
            return runTask<never>(this, configurationErrorTask(invalid));
         }
      }

      const chain = getExecutor(this).chain();
      let result: Promise<unknown> = Promise.resolve();
      for (const task of tasks) {
         result = chain.push(task);
      }

      return chainedTask<R>(this, chain, result);
   }

   /**
    * Runs a single command through `git`, resolving with the raw `stdout`
    * response as a string. Accepts a pre-built task descriptor, an array of
    * command strings, varargs strings, and an optional trailing options
    * object (the string prefix may be empty, so an options-only call is
    * supported).
    */
   raw(task: GitTask<unknown>): ChainedResponse<string>;
   raw(commands: TaskOptions): ChainedResponse<string>;
   raw(...args: [...commands: string[], options: Options]): ChainedResponse<string>;
   raw(...commands: string[]): ChainedResponse<string>;
   raw(...args: unknown[]): ChainedResponse<string> {
      assertNoTrailingCallback(args);

      const [head] = args;

      if (args.length === 1 && isTaskDescriptor(head)) {
         return runTask(this, head) as unknown as ChainedResponse<string>;
      }

      // values are deliberately not coerced through `String()` - pathspec
      // wrappers must reach the suffix-paths pipeline step intact
      const command: string[] = [];
      if (Array.isArray(head)) {
         command.push(...(head as string[]));
      } else {
         for (let i = 0; i < args.length; i++) {
            if (!filterPrimitives(args[i])) {
               break;
            }
            command.push(args[i] as string);
         }
         command.push(...getTrailingOptions(args, 0, true));
      }

      if (!command.length) {
         return runTask<string>(
            this,
            configurationErrorTask('Raw: must supply one or more command to execute')
         );
      }

      return runTask(this, straightThroughStringTask(command, this._trimmed));
   }

   /**
    * Runs a single task, resolving with an async iterator over the raw
    * `Buffer` chunks of the child process `stdout` - `stderr` is not streamed,
    * it is retained for error reporting as it is for any other task.
    *
    * The promise resolves as soon as the process is known to be running (its
    * first chunk of output, or its completion for a command that writes
    * nothing), so a pipeline guard that prevents the spawn rejects the promise
    * and yields no iterator at all. A process that spawns but then fails
    * surfaces its error out of the iterator, after any chunks it did produce.
    */
   stream<R>(task: GitTask<R>): ChainedResponse<AsyncIterableIterator<Buffer>> {
      assertNoTrailingCallback(arguments);

      const invalid = taskShapeError(task);
      if (invalid) {
         return runTask<never>(this, configurationErrorTask(invalid));
      }

      const chain = getExecutor(this).chain();

      if (isEmptyTask(task)) {
         return runTask<never>(
            this,
            configurationErrorTask(
               'Git.stream: v4: cannot be called with an empty task configuration'
            )
         );
      }

      return chainedTask(
         this,
         chain,
         new Promise<AsyncIterableIterator<Buffer>>((resolve, reject) => {
            const queue = createBufferQueue();
            // the spread drops the caller's trust brand (it is non-enumerable),
            // so the wrapper is branded here on its own merit - this is the one
            // place an `onStream` handler is allowed to come from
            const streamedTask: RunnableTask<R> = trustedTask({
               ...task,
               onStream({ name, buffer }: { name: 'stdOut' | 'stdErr'; buffer: Buffer }) {
                  if (name !== 'stdOut') {
                     return;
                  }

                  // the process is live, so the caller can have its iterator -
                  // the queue holds chunks until they are pulled, no output is
                  // lost to a consumer that has not started iterating yet
                  resolve(queue.iterable);
                  queue.push(buffer);
               },
            });

            chain.push(streamedTask).then(
               () => {
                  // a no-output success resolves here rather than never
                  resolve(queue.iterable);
                  queue.end();
               },
               (error: Error) => {
                  // after `resolve` above this is inert, leaving the iterator
                  // as the only place the failure can surface
                  reject(error);
                  queue.fail(error);
               }
            );
         })
      );
   }

   /**
    * Sets the path to the working directory used by all subsequent tasks -
    * validated by running `git rev-parse --show-toplevel` in the directory.
    * Pass `{ path, root: true }` to update the whole instance rather than
    * just the current chain.
    */
   cwd(directory: string | { path: string; root?: boolean }): ChainedResponse<string> {
      assertNoTrailingCallback(arguments);

      if (typeof directory === 'string') {
         return runTask<never>(this, changeWorkingDirectoryTask(directory, getExecutor(this)));
      }

      if (typeof directory?.path === 'string') {
         return runTask<string>(
            this,
            changeWorkingDirectoryTask(
               directory.path,
               (directory.root && getExecutor(this)) || undefined
            )
         );
      }

      return runTask<never>(
         this,
         configurationErrorTask('Git.cwd: workingDirectory must be supplied as a string')
      );
   }

   /**
    * Initialize a repository at the executor's current working directory.
    */
   init(bare?: boolean | unknown, ...args: unknown[]): ChainedResponse<InitResult> {
      assertNoTrailingCallback([bare, ...args]);
      return runTask(
         this,
         initTask(bare === true, getExecutor(this).cwd, getTrailingOptions([bare, ...args]))
      );
   }

   /**
    * Internally uses pull and tags to get the list of tags then checks out
    * the latest tag.
    */
   checkoutLatestTag(): Promise<string> {
      return runTask(
         this,
         adhocExecTask(async () => {
            await this.pull();
            const { latest } = await this.tags();
            return await this.checkout(String(latest));
         })
      ) as unknown as Promise<string>;
   }

   /**
    * Sets environment variables to be supplied to every subsequently run
    * task. Recording only intent - the effective child process environment is
    * assembled per task at spawn time from the ambient environment plus these
    * values, then filtered by the deny-by-default environment guard, so a
    * blocked key rejects the task it is used with rather than this call.
    */
   env(name: string, value: string): this;
   env(env: NodeJS.ProcessEnv): this;
   env(name: string | NodeJS.ProcessEnv, value?: string): this {
      const executor = getExecutor(this);

      if (typeof name === 'object') {
         executor.env = name;
      } else {
         (executor.env = executor.env || {})[name] = value;
      }

      return this;
   }

   /**
    * @deprecated
    *
    * For v4, switch to using the `outputHandler` configuration option when
    * creating the `simpleGit` instance.
    */
   outputHandler(): ChainedResponse<void> {
      return runTask(
         this,
         configurationErrorTask(
            'Git.outputHandler: v4: use the `outputHandler` configuration option instead'
         )
      );
   }

   /**
    * Sets the command to use to reference the `git` binary - validated with
    * the same restricted character set as the `binary` constructor option,
    * throwing immediately (not per task) for unsafe values unless the
    * `unsafe.allowUnsafeCustomBinary` option is set.
    */
   customBinary(command: SimpleGitCoreOptions['binary']): this {
      getExecutor(this).binary = createBinaryConfig(command, this._allowUnsafeCustomBinary);
      return this;
   }

   /**
    * Schedules the supplied function to run once the tasks queued before it
    * have completed - the function payload here is not a trailing callback.
    */
   exec(handle?: () => void): ChainedResponse<void> {
      return runTask(
         this,
         adhocExecTask(() => {
            if (typeof handle === 'function') {
               handle();
            }
         })
      );
   }
}

registerBindings(SimpleGitCore.prototype);

/**
 * Creates a new `SimpleGitCore` instance - `baseDir` may be given as the
 * first argument or as a property of the options object.
 */
export function simpleGit(
   baseDir?: string | Partial<SimpleGitCoreOptions>,
   options?: Partial<SimpleGitCoreOptions>
): SimpleGitCore {
   const config: Partial<SimpleGitCoreOptions> = {
      ...(typeof baseDir === 'string' ? { baseDir } : baseDir),
      ...options,
   };

   return new SimpleGitCore(config);
}
