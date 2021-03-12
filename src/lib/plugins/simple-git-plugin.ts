import { ChildProcess } from 'child_process';
import { GitExecutorResult } from '../types';

type SimpleGitTaskPluginContext = {
   readonly method: string;
   readonly commands: string[];
}

export interface SimpleGitPluginTypes {
   'spawn.args': {
      data: string[];
      context: SimpleGitTaskPluginContext & {};
   };
   'spawn.after': {
      data: void;
      context: SimpleGitTaskPluginContext & {
         spawned: ChildProcess;
         kill (reason: Error): void;
      };
   },
   'task.error': {
      data: { error?: Error | string };
      context: SimpleGitTaskPluginContext & GitExecutorResult;
   },
}

export type SimpleGitPluginType = keyof SimpleGitPluginTypes;

export interface SimpleGitPlugin<T extends SimpleGitPluginType> {
   action(data: SimpleGitPluginTypes[T]['data'], context: SimpleGitPluginTypes[T]['context']): typeof data;

   type: T;
}
