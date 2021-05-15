import { SimpleGitBase } from '../../typings';
import { taskCallback } from './task-callback';
import { changeWorkingDirectoryTask } from './tasks/change-working-directory';
import { initTask } from './tasks/init';
import { pushTask } from './tasks/push';
import { statusTask } from './tasks/status';
import { configurationErrorTask, straightThroughStringTask } from './tasks/task';
import { outputHandler, SimpleGitExecutor, SimpleGitTask, SimpleGitTaskCallback } from './types';
import { asArray, filterString, filterType, getTrailingOptions, trailingFunctionArgument } from './utils';

export class SimpleGitApi implements SimpleGitBase {

   constructor(private _executor: SimpleGitExecutor) {}

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

   cwd(directory: string | { path: string, root?: boolean }) {
      const next = trailingFunctionArgument(arguments);

      if (typeof directory === 'string') {
         return this._runTask(changeWorkingDirectoryTask(directory, this._executor), next);
      }

      if (typeof directory?.path === 'string') {
         return this._runTask(changeWorkingDirectoryTask(directory.path, directory.root && this._executor || undefined), next);
      }

      return this._runTask(
         configurationErrorTask('Git.cwd: workingDirectory must be supplied as a string'),
         next
      );
   }

   init (bare?: boolean | unknown) {
      return this._runTask(
         initTask(bare === true, this._executor.cwd, getTrailingOptions(arguments)),
         trailingFunctionArgument(arguments),
      );
   }

   outputHandler (handler: outputHandler) {
      this._executor.outputHandler = handler;
      return this;
   }

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

   stash () {
      return this._runTask(
         straightThroughStringTask(['stash', ...getTrailingOptions(arguments)]),
         trailingFunctionArgument(arguments),
      );
   }

   status () {
      return this._runTask(statusTask(getTrailingOptions(arguments)), trailingFunctionArgument(arguments));
   }
}
