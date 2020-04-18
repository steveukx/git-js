
export interface SimpleGitTaskConfiguration<RESPONSE, FORMAT, INPUT> {

   commands: string[]
   format: FORMAT;
   parser (text: INPUT): RESPONSE;

   concatStdErr?: boolean;
   onError?: (
      exitCode: number,
      error: string,
      done:(result: INPUT) => void,
      fail:(error: string) => void,
   ) => void;

}

export type StringTask<R> = SimpleGitTaskConfiguration<R, 'utf-8', string>;

export type BufferTask<R> = SimpleGitTaskConfiguration<R, 'buffer', Buffer>;

export type SimpleGitTask<R> = StringTask<R> | BufferTask<R>;


export function isBufferTask<R> (task: SimpleGitTask<R>): task is BufferTask<R> {
   return task.format === 'buffer';
}
