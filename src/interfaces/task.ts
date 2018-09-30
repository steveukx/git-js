import { AsyncResultCallback } from 'async';
import { RunnerOptions } from './command-runner';
import { Nullable } from './types';

export interface PromiseHandlerTask<T = any> {
   command: string[];
   parser: (content: string) => T;
   options: RunnerOptions;
}

export interface AsyncHandlerTask<T = any> extends PromiseHandlerTask<T> {
   handler: AsyncResultCallback<T, Nullable<Error>>;
}

export type Task<T = any> = PromiseHandlerTask<T> | AsyncHandlerTask<T>;
