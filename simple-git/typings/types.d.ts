export type { RemoteWithoutRefs, RemoteWithRefs } from '../src/lib/responses/GetRemoteSummary';
export type { LogOptions, DefaultLogFields } from '../src/lib/tasks/log';

export type {
   outputHandler,
   Options,
   TaskOptions,
   SimpleGitOptions,
   SimpleGitProgressEvent,
   SimpleGitTaskCallback,
} from '../src/lib/types';

export type { ApplyOptions } from '../src/lib/tasks/apply-patch';
export { CheckRepoActions } from '../src/lib/tasks/check-is-repo';
export { CleanOptions, CleanMode } from '../src/lib/tasks/clean';
export type { CloneOptions } from '../src/lib/tasks/clone';
export { GitConfigScope } from '../src/lib/tasks/config';
export { GitGrepQuery, grepQueryBuilder } from '../src/lib/tasks/grep';
export { ResetOptions, ResetMode } from '../src/lib/tasks/reset';
export type { VersionResult } from '../src/lib/tasks/version';
