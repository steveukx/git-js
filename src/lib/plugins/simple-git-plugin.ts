export interface SimpleGitPluginTypes {
   'spawn.args': {
      data: string[];
      context: {};
   };
}

export type SimpleGitPluginType = keyof SimpleGitPluginTypes;

export interface SimpleGitPlugin<T extends SimpleGitPluginType> {
   action(data: SimpleGitPluginTypes[T]['data'], context: SimpleGitPluginTypes[T]['context']): typeof data;

   type: T;
}
