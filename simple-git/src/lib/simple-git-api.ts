import { SimpleGitBase } from '../../typings';
import { taskCallback } from './task-callback';
import { changeWorkingDirectoryTask } from './tasks/change-working-directory';
import checkout from './tasks/checkout';
import countObjects from './tasks/count-objects';
import commit from './tasks/commit';
import config from './tasks/config';
import firstCommit from './tasks/first-commit';
import grep from './tasks/grep';
import { hashObjectTask } from './tasks/hash-object';
import { initTask } from './tasks/init';
import log from './tasks/log';
import { mergeTask } from './tasks/merge';
import { pushTask } from './tasks/push';
import show from './tasks/show';
import { statusTask } from './tasks/status';
import { configurationErrorTask, straightThroughStringTask } from './tasks/task';
import version from './tasks/version';
import { outputHandler, SimpleGitExecutor, SimpleGitTask, SimpleGitTaskCallback } from './types';
import {
   asArray,
   filterString,
   filterType,
   getTrailingOptions,
   trailingFunctionArgument,
} from './utils';

export class SimpleGitApi implements SimpleGitBase {
   constructor(private _executor: SimpleGitExecutor) {}

   protected _runTask<T>(task: SimpleGitTask<T>, then?: SimpleGitTaskCallback<T>) {
      const chain = this._executor.chain();
      const promise = chain.push(task);

      if (then) {
         taskCallback(task, promise, then);
      }

      return Object.create(this, {
         then: { value: promise.then.bind(promise) },
         catch: { value: promise.catch.bind(promise) },
         _executor: { value: chain },
      });
   }

   add(files: string | string[]) {
      return this._runTask(
         straightThroughStringTask(['add', ...asArray(files)]),
         trailingFunctionArgument(arguments)
      );
   }

   cwd(directory: string | { path: string; root?: boolean }) {
      const next = trailingFunctionArgument(arguments);

      if (typeof directory === 'string') {
         return this._runTask(changeWorkingDirectoryTask(directory, this._executor), next);
      }

      if (typeof directory?.path === 'string') {
         return this._runTask(
            changeWorkingDirectoryTask(
               directory.path,
               (directory.root && this._executor) || undefined
            ),
            next
         );
      }

      return this._runTask(
         configurationErrorTask('Git.cwd: workingDirectory must be supplied as a string'),
         next
      );
   }

   hashObject(path: string, write: boolean | unknown) {
      return this._runTask(
         hashObjectTask(path, write === true),
         trailingFunctionArgument(arguments)
      );
   }

   init(bare?: boolean | unknown) {
      return this._runTask(
         initTask(bare === true, this._executor.cwd, getTrailingOptions(arguments)),
         trailingFunctionArgument(arguments)
      );
   }

   merge() {
      return this._runTask(
         mergeTask(getTrailingOptions(arguments)),
         trailingFunctionArgument(arguments)
      );
   }

   mergeFromTo(remote: string, branch: string) {
      if (!(filterString(remote) && filterString(branch))) {
         return this._runTask(
            configurationErrorTask(
               `Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings`
            )
         );
      }

      return this._runTask(
         mergeTask([remote, branch, ...getTrailingOptions(arguments)]),
         trailingFunctionArgument(arguments, false)
      );
   }

   outputHandler(handler: outputHandler) {
      this._executor.outputHandler = handler;
      return this;
   }

   push() {
      const task = pushTask(
         {
            remote: filterType(arguments[0], filterString),
            branch: filterType(arguments[1], filterString),
         },
         getTrailingOptions(arguments)
      );

      return this._runTask(task, trailingFunctionArgument(arguments));
   }

   stash() {
      return this._runTask(
         straightThroughStringTask(['stash', ...getTrailingOptions(arguments)]),
         trailingFunctionArgument(arguments)
      );
   }

   status() {
      return this._runTask(
         statusTask(getTrailingOptions(arguments)),
         trailingFunctionArgument(arguments)
      );
   }
}

Object.assign(
   SimpleGitApi.prototype,
   checkout(),
   commit(),
   config(),
   countObjects(),
   firstCommit(),
   grep(),
   log(),
   show(),
   version()
);
