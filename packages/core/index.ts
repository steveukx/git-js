export { isConfigWriteAllowed } from './src/config/allow-config-write';
export {
   allowConfigWriteUser,
   blessConfig,
   blessedConfigIntent,
   type ConfigWriteIntent,
   isBlessedConfig,
} from './src/config/bless-config';
export { GitEnvKeys, isGuardedEnvKey } from './src/config/git-env-keys';
export { GitError } from './src/errors/git-error';
export { GitPluginError } from './src/errors/git-plugin-error';
export { TaskConfigurationError } from './src/errors/task-configuration-error';
export { createGit } from './src/executor/create-git';
export type {
   OutputHandler,
   SimpleGitOptions,
   SpawnResult,
} from './src/executor/executor.types';
export { GitExecutor } from './src/executor/git-executor';
export type {
   Maybe,
   OptionFlags,
   Options,
   OptionsValues,
   TaskOptions,
   VariadicOptions,
} from './src/options/options.types';
export { appendOptions, asTaskOptions } from './src/options/task-options';
export type { LineReader, UseMatches } from './src/parsing/line-parser';
export { LineParser, RemoteLineParser } from './src/parsing/line-parser';
export { asArray, asNumber, toLinesWithContent } from './src/parsing/parse.helpers';
export { type CommitResult, parseCommitResult } from './src/parsing/parse-commit';
export { parseStringResponse } from './src/parsing/parse-string-response';
export { commandConfigPrefixingPlugin } from './src/plugins/command-config-prefixing-plugin';
export { configWriteGuardPlugin } from './src/plugins/config-write-guard-plugin';
export { environmentFilterPlugin } from './src/plugins/environment-filter-plugin';
export type {
   PluginMap,
   PluginType,
   SimpleGitPlugin,
   SpawnContext,
   SpawnOptionsData,
} from './src/plugins/plugin.types';
export { PluginStore } from './src/plugins/plugin-store';
export { ExitCodes } from './src/task/exit-codes';
export {
   bufferTask,
   configurationErrorTask,
   emptyTask,
   isBufferTask,
   isEmptyTask,
   stringTask,
} from './src/task/task';
export type {
   BufferTask,
   EmptyTask,
   EmptyTaskParser,
   GitTask,
   StringTask,
   TaskErrorContext,
   TaskErrorHandler,
   TaskParser,
   TaskResponseFormat,
} from './src/task/task.types';
export type { AddResult } from './src/tasks/add';
export { add } from './src/tasks/add';
export { catFile, catFileBuffer } from './src/tasks/cat-file';
export { commit } from './src/tasks/commit';
export type { InitResult } from './src/tasks/init';
export { init, parseInit } from './src/tasks/init';
export { type LsFilesResult, lsFiles } from './src/tasks/ls-files';
export type { ResetOptions } from './src/tasks/reset';
export { getResetMode, ResetMode, reset } from './src/tasks/reset';
export type { VersionResult } from './src/tasks/version';
export { parseVersion, version } from './src/tasks/version';
