export type { LineReader, UseMatches } from './src/parsing/line-parser';
export { LineParser, RemoteLineParser } from './src/parsing/line-parser';
export { asArray, asNumber, toLinesWithContent } from './src/parsing/parse.helpers';
export { parseStringResponse } from './src/parsing/parse-string-response';
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
export type { InitResult } from './src/tasks/init';
export { init, parseInit } from './src/tasks/init';
export type { VersionResult } from './src/tasks/version';
export { parseVersion, version } from './src/tasks/version';
