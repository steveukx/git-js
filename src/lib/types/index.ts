import { SpawnOptions } from 'child_process';

import { SimpleGitTask } from './tasks';
import { SimpleGitProgressEvent } from './handlers';

export * from './handlers';
export * from './tasks';

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
export type OptionsValues = null | string | number;
export type Options = Record<string, OptionsValues>;

export type OptionFlags<FLAGS extends string, VALUE = null> = Partial<Record<FLAGS, VALUE>>;

/**
 * A function called by the executor immediately after creating a child
 * process. Allows the calling application to implement custom handling of
 * the incoming stream of data from the `git`.
 */
export type outputHandler = (
   command: string,
   stdout: NodeJS.ReadableStream,
   stderr: NodeJS.ReadableStream,
   args: string[],
) => void

/**
 * Environment variables to be passed into the child process.
 */
export type GitExecutorEnv = NodeJS.ProcessEnv | undefined;


/**
 * Public interface of the Executor
 */
export interface SimpleGitExecutor {
   env: GitExecutorEnv;
   outputHandler?: outputHandler;
   binary: string;
   cwd: string;

   chain(): SimpleGitExecutor;

   push<R>(task: SimpleGitTask<R>): Promise<R>;
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

export interface SimpleGitPluginConfig {

   /**
    * Configures the events that should be used to determine when the unederlying child process has
    * been terminated.
    *
    * Version 2 will default to use `onClose=true, onExit=50` to mean the `close` event will be
    * used to immediately treat the child process as closed and start using the data from `stdOut`
    * / `stdErr`, whereas the `exit` event will wait `50ms` before treating the child process
    * as closed.
    *
    * This will be changed in version 3 to use `onClose=true, onExit=false` so that only the
    * close event is used to determine the termination of the process.
    */
   completion: {
      onClose?: boolean | number;
      onExit?: boolean | number;
   };

   /**
    * Configures the content of errors thrown by the `simple-git` instance for each task
    */
   errors(error: Buffer | Error | undefined, result: Omit<GitExecutorResult, 'rejection'>): Buffer | Error | undefined;

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
   };

   spawnOptions: Pick<SpawnOptions, 'uid' | 'gid'>;
}

/**
 * Optional configuration settings to be passed to the `simpleGit`
 * builder.
 */
export interface SimpleGitOptions extends Partial<SimpleGitPluginConfig> {
   baseDir: string;
   binary: string;
   maxConcurrentProcesses: number;
   config: string[];
}

export type Maybe<T> = T | undefined;
export type MaybeArray<T> = T | T[];

export type Primitives = string | number | boolean;
