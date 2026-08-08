import type { SpawnOptions } from 'node:child_process';

import type { VulnerabilityCategoryFlags } from '@simple-git/argv-parser';

import type { GitBinary } from './pipeline/types';
import type { GitTask } from './tasks';

export type {
   BufferTask,
   EmptyTask,
   EmptyTaskParser,
   GitTask,
   GitTaskConfiguration,
   RunnableTask,
   StringTask,
   TaskParser,
   TaskResponseFormat,
} from './tasks/task';

export type Maybe<T> = T | undefined;
export type MaybeArray<T> = T | T[];

export type Primitives = string | number | boolean;

/**
 * Most tasks accept custom options as an array of strings as well as the
 * options object. Unless the task is explicitly documented as such, the
 * tasks will not accept both formats at the same time, preferring whichever
 * appears last in the arguments.
 */
export type TaskOptions<O extends Options = Options> = string[] | O;

/**
 * Options supplied in most tasks as an optional trailing object
 */
export type OptionsValues = null | string | number | (string | number)[];
export type Options = Record<string, OptionsValues>;

export type OptionFlags<FLAGS extends string, VALUE = null> = Partial<Record<FLAGS, VALUE>>;

/**
 * @deprecated
 * In v4 switch to using the `outputHandler` configuration option
 */
export type outputHandler = never;

/**
 * Environment variables the caller has asked to supply to the child process
 * through `.env()`. The effective environment is assembled per task at spawn
 * time from the ambient environment plus these values, then filtered by the
 * deny-by-default environment guard.
 */
export type GitExecutorEnv = NodeJS.ProcessEnv | undefined;

/**
 * Public interface of the Executor
 */
export interface SimpleGitExecutor {
   env: GitExecutorEnv;
   cwd: string;
   binary: GitBinary;

   chain(): SimpleGitExecutor;

   push<R>(task: GitTask<R>): Promise<R>;
}

/**
 * The resulting output from running the git child process
 */
export interface GitExecutorResult {
   stdOut: Buffer[];
   stdErr: Buffer[];
   exitCode: number;
   rejection: Maybe<Error>;
}

/**
 * The event data emitted to the progress handler whenever progress detail is received.
 */
export interface SimpleGitProgressEvent {
   /** The underlying method called - push, pull etc */
   method: string;
   /** The type of progress being reported, note that any one task may emit many stages - for example `git clone` emits both `receiving` and `resolving` */
   stage: 'compressing' | 'counting' | 'receiving' | 'resolving' | 'unknown' | 'writing' | string;
   /** The percent progressed as a number 0 - 100 */
   progress: number;
   /** The number of items processed so far */
   processed: number;
   /** The total number of items to be processed */
   total: number;
}

export interface SimpleGitPluginConfig {
   abort: AbortSignal;

   /**
    * Name of the binary the child processes will spawn - defaults to `git`,
    * supply as a tuple to enable the use of platforms that require `git` to be
    * called through an alternative binary (eg: `wsl git ...`).
    * Note: commands supplied in this way support a restricted set of characters
    * and should not be used as a way to supply arbitrary config arguments etc.
    */
   binary: string | [string] | [string, string];

   /**
    * Configures the events that should be used to determine when the underlying
    * child process has been terminated - `onClose=true, onExit=50` means the
    * `close` event immediately treats the child process as closed and starts
    * using the data from `stdOut` / `stdErr`, whereas the `exit` event waits
    * `50ms` before treating the child process as closed.
    */
   completion: {
      onClose?: boolean | number;
      onExit?: boolean | number;
   };

   /**
    * Configures the content of errors thrown by the instance for each task
    */
   errors(
      error: Buffer | Error | undefined,
      result: Omit<GitExecutorResult, 'rejection'>
   ): Buffer | Error | undefined;

   /**
    * Configures a listener to be called as the child process is launched.
    * This handler replaces the v3 `outputHandler` function on the `simpleGit` instance.
    * Commands/arguments passed to this function are immutable.
    */
   outputHandler(
      command: string,
      stdout: NodeJS.ReadableStream,
      stderr: NodeJS.ReadableStream,
      args: string[]
   ): void | (() => void);

   /**
    * Handler to be called with progress events emitted through the progress plugin
    */
   progress(data: SimpleGitProgressEvent): void;

   /**
    * Configuration for the `timeoutPlugin`
    */
   timeout: {
      /**
       * The number of milliseconds to wait after spawning the process / receiving
       * content on the stdOut/stdErr streams before forcibly closing the git process.
       */
      block: number;

      /**
       * Reset timeout plugin after receiving data on `stdErr` - set to `false` to ignore
       * `stdErr` content when determining whether to kill the process (defaults to `true`).
       */
      stdErr?: boolean;

      /**
       * Reset timeout plugin after receiving data on `stdOut` - set to `false` to ignore
       * `stdOut` content when determining whether to kill the process (defaults to `true`).
       */
      stdOut?: boolean;
   };

   spawnOptions: Pick<SpawnOptions, 'uid' | 'gid'>;

   unsafe: Partial<
      VulnerabilityCategoryFlags & {
         /**
          * Allows potentially unsafe values to be supplied in the `binary` configuration option and
          * `git.customBinary()` method call.
          */
         allowUnsafeCustomBinary: boolean;
      }
   >;
}

/**
 * Optional configuration settings to be passed to the `simpleGit` builder.
 */
export interface SimpleGitCoreOptions extends Partial<SimpleGitPluginConfig> {
   /**
    * Base directory for all tasks run through this instance
    */
   baseDir: string;
   /**
    * Limit for the number of child processes that will be spawned concurrently from the instance
    */
   maxConcurrentProcesses: number;
   /**
    * Per-command configuration parameters to be passed with the `-c` switch to `git`.
    * Subject to the `allowConfigWrite` allow-list the same as a runtime `-c`.
    */
   config: string[];
   /**
    * Enable trimming of trailing white-space in `git.raw`
    */
   trimmed: boolean;
   /**
    * Environment variables in the guarded `GitEnvKeys` set (every `GIT_`-prefixed
    * key plus known-vulnerable non-prefixed keys such as `EDITOR` / `PAGER`) are
    * removed from the child process environment unless named here. A guarded key
    * supplied explicitly through `.env()` and not named here rejects the task it
    * is used with; guarded keys inherited from the ambient environment are
    * stripped and logged to the `debug` output.
    */
   allowEnvironment: readonly string[];
   /**
    * Git config writes (via `-c key=value`, `git config` set/unset, `--config-env`
    * or `GIT_CONFIG_*` environment variables) are blocked unless the key matches
    * one of these patterns. Supports `*` wildcards on a dot-segment basis, eg
    * `remote.*.url`. Nothing is unconditionally writable.
    */
   allowConfigWrite: readonly string[];
}
