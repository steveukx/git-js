import { TaskConfigurationError } from '../errors/task-configuration-error';

export const EMPTY_COMMANDS: [] = [];

export type TaskResponseFormat = Buffer | string;

export interface TaskParser<INPUT extends TaskResponseFormat, RESPONSE> {
   (stdOut: INPUT, stdErr: INPUT): RESPONSE;
}

export interface EmptyTaskParser<RESPONSE> {
   (): RESPONSE;
}

export interface SimpleGitTaskConfiguration<RESPONSE, FORMAT, INPUT extends TaskResponseFormat> {

   commands: string[]
   format: FORMAT;
   parser: TaskParser<INPUT, RESPONSE>;

   onError?: (
      exitCode: number,
      error: string,
      done: (result: INPUT) => void,
      fail: (error: string) => void,
   ) => void;

   /**
    * @deprecated
    * Use of `concatStdErr` is now deprecated, to be removed by v2.50.0 (or on upgrading to v3).
    * Instead, use the `stdErr` argument supplied to the `parser`
    */
   concatStdErr?: boolean;
}

export type EmptyTask<RESPONSE = void> = SimpleGitTaskConfiguration<RESPONSE, 'utf-8', string> & {
   commands: typeof EMPTY_COMMANDS;
   parser: EmptyTaskParser<RESPONSE>;
};

export type StringTask<R> = SimpleGitTaskConfiguration<R, 'utf-8', string>;

export type BufferTask<R> = SimpleGitTaskConfiguration<R, 'buffer', Buffer>;

export type RunnableTask<R> = StringTask<R> | BufferTask<R>;

export type SimpleGitTask<R> = RunnableTask<R> | EmptyTask;

export function adhocExecTask<R> (parser: () => R): StringTask<R> {
   return {
      commands: EMPTY_COMMANDS,
      format: 'utf-8',
      parser,
   }
}

export function configurationErrorTask(error: Error | string): EmptyTask {
   return {
      commands: EMPTY_COMMANDS,
      format: 'utf-8',
      parser() {
         throw typeof error === 'string' ? new TaskConfigurationError(error) : error;
      }
   }
}

export function straightThroughStringTask(commands: string[], trimmed = false): StringTask<string> {
   return {
      commands,
      format: 'utf-8',
      parser(text) {
         return trimmed ? String(text).trim() : text;
      },
   }
}

export function isBufferTask<R>(task: SimpleGitTask<R>): task is BufferTask<R> {
   return task.format === 'buffer';
}

export function isEmptyTask<R>(task: SimpleGitTask<R>): task is EmptyTask {
   return !task.commands.length;
}
