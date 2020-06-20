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
