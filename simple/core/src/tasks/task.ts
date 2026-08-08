import { TaskConfigurationError } from '../errors/task-configuration-error';
import { trustedTask } from '../guards/trusted-task';
import type { GitExecutorResult, SimpleGitExecutor } from '../types';

export type TaskResponseFormat = Buffer | string;

export interface TaskParser<INPUT extends TaskResponseFormat, RESPONSE> {
   (stdOut: INPUT, stdErr: INPUT): RESPONSE;
}

export interface EmptyTaskParser {
   (executor: SimpleGitExecutor): void;
}

/**
 * A task is a plain, executor-agnostic descriptor carrying everything needed
 * to run and interpret one `git` command - including its choice of utf-8 vs
 * buffer output handling.
 */
export interface GitTaskConfiguration<RESPONSE, FORMAT, INPUT extends TaskResponseFormat> {
   commands: string[];
   format: FORMAT;
   parser: TaskParser<INPUT, RESPONSE>;
   onStream?: (stream: { name: 'stdOut' | 'stdErr'; buffer: Buffer }) => void;

   onError?: (
      result: GitExecutorResult,
      error: Error,
      done: (result: Buffer | Buffer[]) => void,
      fail: (error: string | Error) => void
   ) => void;
}

export type StringTask<R> = GitTaskConfiguration<R, 'utf-8', string>;

export type BufferTask<R> = GitTaskConfiguration<R, 'buffer', Buffer>;

export type RunnableTask<R> = StringTask<R> | BufferTask<R>;

export type GitTask<R> = RunnableTask<R> | EmptyTask;

export const EMPTY_COMMANDS: [] = [];

export type EmptyTask = {
   commands: typeof EMPTY_COMMANDS;
   format: 'empty';
   parser: EmptyTaskParser;
   onError?: undefined;
   onStream?: undefined;
};

/**
 * Empty tasks bypass the child process entirely and are handed the live
 * executor as their parser argument, so they are only ever created here, from
 * trusted internal call sites, and are branded as such.
 */
export function adhocExecTask(parser: EmptyTaskParser): EmptyTask {
   return trustedTask({
      commands: EMPTY_COMMANDS,
      format: 'empty',
      parser,
   });
}

export function configurationErrorTask(error: Error | string): EmptyTask {
   return trustedTask({
      commands: EMPTY_COMMANDS,
      format: 'empty',
      parser() {
         throw typeof error === 'string' ? new TaskConfigurationError(error) : error;
      },
   });
}

export function straightThroughStringTask(commands: string[], trimmed = false): StringTask<string> {
   return {
      commands,
      format: 'utf-8',
      parser(text) {
         return trimmed ? String(text).trim() : text;
      },
   };
}

export function straightThroughBufferTask(commands: string[]): BufferTask<Buffer> {
   return {
      commands,
      format: 'buffer',
      parser(buffer) {
         return buffer;
      },
   };
}

export function isBufferTask<R>(task: GitTask<R>): task is BufferTask<R> {
   return task.format === 'buffer';
}

/**
 * Detects a task descriptor in an arguments list, eg to allow `git.raw` to
 * accept a pre-built task as well as command strings.
 */
export function isTaskDescriptor(input: unknown): input is GitTask<unknown> {
   if (!input || typeof input !== 'object') {
      return false;
   }

   const task = input as Partial<GitTask<unknown>>;
   return (
      Array.isArray(task.commands) &&
      typeof task.format === 'string' &&
      typeof task.parser === 'function'
   );
}

export function isEmptyTask<R>(task: GitTask<R>): task is EmptyTask {
   return task.format === 'empty' || !task.commands.length;
}
