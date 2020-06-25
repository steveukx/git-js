import { SimpleGitTask } from '../tasks/task';

export * from './handlers';

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
export type Options = { [key: string]: null | string | any };

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

   push<R>(task: SimpleGitTask<R>): Promise<void | R>;
}

/**
 * The resulting output from running the git child process
 */
export interface GitExecutorResult {
   stdOut: Buffer[];
   stdErr: Buffer[];
   exitCode: number;
}

/**
 * Optional configuration settings to be passed to the `simpleGit`
 * builder.
 */
export interface SimpleGitOptions {
   baseDir: string;
   binary: string;
   maxConcurrentProcesses: number;
}



export type Maybe<T> = T | undefined;

export type Primitives = string | number | boolean;
