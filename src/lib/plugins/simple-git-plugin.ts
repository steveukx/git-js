import { ChildProcess } from 'child_process';

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
   }
}

export type SimpleGitPluginType = keyof SimpleGitPluginTypes;

export interface SimpleGitPlugin<T extends SimpleGitPluginType> {
   action(data: SimpleGitPluginTypes[T]['data'], context: SimpleGitPluginTypes[T]['context']): typeof data;

   type: T;
}
