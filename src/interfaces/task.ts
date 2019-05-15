
export interface TaskSuccessHandler<Format = string> {
   (output: Format): void;
}

export interface TaskErrorHandler {
   (error: string): void;
}

export interface TaskOptions<SuccessFormat = string> {
   concatStdErr?: boolean;
   format?: string;
   onError?: (exitCode: number, stdErr: string, done: TaskSuccessHandler<SuccessFormat>, fail: TaskErrorHandler) => {};
}

export type Task = [
   Array<string | number>,
   TaskOptions
];
