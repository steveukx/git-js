export { GitEnvKeys, isGitEnvKey } from '@simple-git/argv-parser';

export type { TaskMethods } from './src/bindings';
export * from './src/errors';
export { type ChainedResponse, SimpleGitCore, simpleGit } from './src/git';
export { allowConfigWriteUser } from './src/guards/presets';
export type {
   PushResultRemoteMessages,
   RemoteMessageResult,
   RemoteMessages,
   RemoteMessagesObjectEnumeration,
} from './src/parsers/parse-remote-messages';
export type { GitBinary, PipelineStep, TaskContext } from './src/pipeline/types';
export * from './src/responses';
export * from './src/tasks';
export type {
   GitExecutorResult,
   Maybe,
   MaybeArray,
   OptionFlags,
   Options,
   OptionsValues,
   outputHandler,
   Primitives,
   SimpleGitCoreOptions,
   SimpleGitExecutor,
   SimpleGitPluginConfig,
   SimpleGitProgressEvent,
   TaskOptions,
} from './src/types';
