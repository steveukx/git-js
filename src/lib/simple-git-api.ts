import { PushResult, SimpleGit, SimpleGitBase, TaskOptions } from '../../typings';
import { taskCallback } from './task-callback';
import { pushTask } from './tasks/push';
import { straightThroughStringTask } from './tasks/task';
import { SimpleGitExecutor, SimpleGitTask, SimpleGitTaskCallback } from './types';
import { asArray, filterString, filterType, getTrailingOptions, trailingFunctionArgument } from './utils';

export class SimpleGitApi implements SimpleGitBase {
   private _executor: SimpleGitExecutor;

   constructor(_executor: SimpleGitExecutor) {
      this._executor = _executor;
   }

   private _runTask<T>(task: SimpleGitTask<T>, then?: SimpleGitTaskCallback<T>) {
      const chain = this._executor.chain();
      const promise = chain.push(task);

      if (then) {
         taskCallback(task, promise, then);
      }

      return Object.create(this, {
         then: {value: promise.then.bind(promise)},
         catch: {value: promise.catch.bind(promise)},
         _executor: {value: chain},
      });
   }

   add(files: string | string[]) {
      return this._runTask(
         straightThroughStringTask(['add', ...asArray(files)]),
         trailingFunctionArgument(arguments),
      );
   }

   push(remote?: string, branch?: string, options?: TaskOptions, callback?: SimpleGitTaskCallback<PushResult>): SimpleGit & Promise<PushResult>;
   push(options?: TaskOptions, callback?: SimpleGitTaskCallback<PushResult>): SimpleGit & Promise<PushResult>;
   push(callback?: SimpleGitTaskCallback<PushResult>): SimpleGit & Promise<PushResult>;
   push() {
      const task = pushTask(
         {
            remote: filterType(arguments[0], filterString),
            branch: filterType(arguments[1], filterString),
         },
         getTrailingOptions(arguments),
      );

      return this._runTask(
         task,
         trailingFunctionArgument(arguments),
      );
   }
}
