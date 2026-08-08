import type { ChainedResponse, SimpleGitCore } from './git';
import { assertNoTrailingCallback } from './guards/assert-no-trailing-callback';
import { RUN_TASK } from './symbols';
import type { GitTask, RunnableTask } from './tasks';
import {
   add,
   addAnnotatedTag,
   addConfig,
   addRemote,
   addTag,
   applyPatch,
   binaryCatFile,
   branch,
   branchLocal,
   catFile,
   checkIgnore,
   checkIsRepo,
   checkout,
   checkoutBranch,
   checkoutLocalBranch,
   clean,
   clone,
   commit,
   countObjects,
   deleteLocalBranch,
   deleteLocalBranches,
   diff,
   diffSummary,
   fetch,
   firstCommit,
   getConfig,
   getRemotes,
   grep,
   hashObject,
   listConfig,
   listRemote,
   log,
   merge,
   mergeFromTo,
   mirror,
   mv,
   pull,
   push,
   pushTags,
   rebase,
   remote,
   removeRemote,
   reset,
   revert,
   revparse,
   rm,
   rmKeepLocal,
   show,
   showBuffer,
   stash,
   stashList,
   status,
   subModule,
   submoduleAdd,
   submoduleInit,
   submoduleUpdate,
   tag,
   tags,
   updateServerInfo,
   version,
} from './tasks';

/**
 * The single binding table every sugar method is generated from - each entry
 * maps a familiar v3-shaped method name to the standalone task factory that
 * builds its descriptor, so every command is available both as `git.x()` and
 * as `x()` for use with `run` / `raw` / `stream`. This table is also the
 * natural input for a future docs generator.
 *
 * Not present here (implemented directly on `SimpleGitCore` because they need
 * executor state or a function payload): `cwd`, `env`
 * `customBinary`, `exec`, `init`, `checkoutLatestTag`, `run`,
 * `raw`, `stream`.
 */
type TaskBindings = {
   add: typeof add;
   addAnnotatedTag: typeof addAnnotatedTag;
   addConfig: typeof addConfig;
   addRemote: typeof addRemote;
   addTag: typeof addTag;
   applyPatch: typeof applyPatch;
   binaryCatFile: typeof binaryCatFile;
   branch: typeof branch;
   branchLocal: typeof branchLocal;
   catFile: typeof catFile;
   checkIgnore: typeof checkIgnore;
   checkIsRepo: typeof checkIsRepo;
   checkout: typeof checkout;
   checkoutBranch: typeof checkoutBranch;
   checkoutLocalBranch: typeof checkoutLocalBranch;
   clean: typeof clean;
   clone: typeof clone;
   commit: typeof commit;
   countObjects: typeof countObjects;
   deleteLocalBranch: typeof deleteLocalBranch;
   deleteLocalBranches: typeof deleteLocalBranches;
   diff: typeof diff;
   diffSummary: typeof diffSummary;
   fetch: typeof fetch;
   firstCommit: typeof firstCommit;
   getConfig: typeof getConfig;
   getRemotes: typeof getRemotes;
   grep: typeof grep;
   hashObject: typeof hashObject;
   listConfig: typeof listConfig;
   listRemote: typeof listRemote;
   log: typeof log;
   merge: typeof merge;
   mergeFromTo: typeof mergeFromTo;
   mirror: typeof mirror;
   mv: typeof mv;
   pull: typeof pull;
   push: typeof push;
   pushTags: typeof pushTags;
   rebase: typeof rebase;
   remote: typeof remote;
   removeRemote: typeof removeRemote;
   reset: typeof reset;
   revert: typeof revert;
   revparse: typeof revparse;
   rm: typeof rm;
   rmKeepLocal: typeof rmKeepLocal;
   show: typeof show;
   showBuffer: typeof showBuffer;
   stash: typeof stash;
   stashList: typeof stashList;
   status: typeof status;
   subModule: typeof subModule;
   submoduleAdd: typeof submoduleAdd;
   submoduleInit: typeof submoduleInit;
   submoduleUpdate: typeof submoduleUpdate;
   tag: typeof tag;
   tags: typeof tags;
   updateServerInfo: typeof updateServerInfo;
   version: typeof version;
};

export const taskBindings: TaskBindings = {
   add,
   addAnnotatedTag,
   addConfig,
   addRemote,
   addTag,
   applyPatch,
   binaryCatFile,
   branch,
   branchLocal,
   catFile,
   checkIgnore,
   checkIsRepo,
   checkout,
   checkoutBranch,
   checkoutLocalBranch,
   clean,
   clone,
   commit,
   countObjects,
   deleteLocalBranch,
   deleteLocalBranches,
   diff,
   diffSummary,
   fetch,
   firstCommit,
   getConfig,
   getRemotes,
   grep,
   hashObject,
   listConfig,
   listRemote,
   log,
   merge,
   mergeFromTo,
   mirror,
   mv,
   pull,
   push,
   pushTags,
   rebase,
   remote,
   removeRemote,
   reset,
   revert,
   revparse,
   rm,
   rmKeepLocal,
   show,
   showBuffer,
   stash,
   stashList,
   status,
   subModule,
   submoduleAdd,
   submoduleInit,
   submoduleUpdate,
   tag,
   tags,
   updateServerInfo,
   version,
};

type TaskResult<T> = T extends RunnableTask<infer R> ? R : never;

export type TaskMethods = {
   [K in keyof TaskBindings]: (
      ...args: Parameters<TaskBindings[K]>
   ) => ChainedResponse<TaskResult<ReturnType<TaskBindings[K]>>>;
};

/**
 * Installs one thin wrapper per binding-table entry onto the prototype - the
 * api surface never becomes hand-written prototype soup.
 */
export function registerBindings(prototype: SimpleGitCore): void {
   for (const [name, factory] of Object.entries(taskBindings)) {
      Object.defineProperty(prototype, name, {
         value(this: SimpleGitCore, ...args: unknown[]) {
            assertNoTrailingCallback(args);
            return this[RUN_TASK]((factory as (...args: unknown[]) => GitTask<unknown>)(...args));
         },
         configurable: true,
         writable: true,
         enumerable: false,
      });
   }
}
