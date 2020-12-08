import { EmptyTask } from '../tasks/task';

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

export type StringTask<R> = SimpleGitTaskConfiguration<R, 'utf-8', string>;

export type BufferTask<R> = SimpleGitTaskConfiguration<R, 'buffer', Buffer>;

export type RunnableTask<R> = StringTask<R> | BufferTask<R>;

export type SimpleGitTask<R> = RunnableTask<R> | EmptyTask;
