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
    * Configures the content of errors thrown by the `simple-git` instance for each task
    */
   errors: ((error: Buffer | Error | undefined, result: Omit<GitExecutorResult, 'rejection'>) => Buffer | Error | undefined) | {

      /**
       * By default the error plugin will pass through any error detected by
       * any other plugin, when supplied as `true` allows this error plugin to rewrite errors as
       */
      overwrite?: boolean;

      /**
       * Determines whether the result should be treated as an error. By default tasks
       * are deemed to have failed when there is a non-zero `exitCode` and there was
       * some content sent to the `stdErr` stream.
       */
      isError? (result: Omit<GitExecutorResult, 'rejection'>): boolean;

      errorMessage? (result: Omit<GitExecutorResult, 'rejection'>): Buffer | Error;
   };

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

export type Primitives = string | number | boolean;
