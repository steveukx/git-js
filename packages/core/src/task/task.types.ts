/**
 * A git task is an executor-agnostic descriptor: it carries everything needed to
 * run a single git command and interpret its output, including whether the output
 * should be read as utf-8 text, a raw buffer, or not run at all (`empty`). The
 * same descriptor can be handed to any executor (`run`, `raw`, `stream`).
 */
export type TaskResponseFormat = 'utf-8' | 'buffer' | 'empty';

/**
 * Parses the raw output of a git command into the task's response type. The input
 * type is determined by the task `format` (string for utf-8, Buffer for buffer).
 */
export type TaskParser<INPUT, RESPONSE> = (stdOut: INPUT, stdErr: INPUT) => RESPONSE;

export type EmptyTaskParser<RESPONSE> = () => RESPONSE;

/**
 * The information available to a task when the git process exits with an error,
 * allowing the task to recover (`done`) or escalate (`fail`) on its own terms —
 * for example `version` treating "command not found" as a not-installed result.
 */
export interface TaskErrorContext {
   exitCode: number;
   stdOut: Buffer;
   stdErr: Buffer;
}

export type TaskErrorHandler = (
   context: TaskErrorContext,
   error: Error,
   done: (data: Buffer) => void,
   fail: (error: Error) => void
) => void;

export interface StringTask<RESPONSE> {
   format: 'utf-8';
   commands: string[];
   parser: TaskParser<string, RESPONSE>;
   onError?: TaskErrorHandler;
}

export interface BufferTask<RESPONSE> {
   format: 'buffer';
   commands: string[];
   parser: TaskParser<Buffer, RESPONSE>;
   onError?: TaskErrorHandler;
}

export interface EmptyTask<RESPONSE = void> {
   format: 'empty';
   commands: readonly [];
   parser: EmptyTaskParser<RESPONSE>;
   onError?: undefined;
}

/**
 * The union of every task shape. A consumer building a task only ever constructs
 * one of the concrete shapes; `GitTask` is what the executor surface accepts.
 */
export type GitTask<RESPONSE> = StringTask<RESPONSE> | BufferTask<RESPONSE> | EmptyTask<RESPONSE>;
