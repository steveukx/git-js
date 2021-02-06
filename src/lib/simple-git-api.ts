import { SimpleGitBase } from '../../typings';
import { straightThroughStringTask } from './tasks/task';
import { SimpleGitExecutor, SimpleGitTask, SimpleGitTaskCallback } from './types';
import { asArray, trailingFunctionArgument } from './utils';
import { taskCallback } from './task-callback';

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
}
