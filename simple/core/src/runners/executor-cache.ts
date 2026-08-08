import type { TaskMethods } from '../bindings';
import type { SimpleGitExecutor } from '../types';

const ExecutorCache = new WeakMap<TaskMethods, SimpleGitExecutor>();

export function setExecutor(instance: TaskMethods, executor: SimpleGitExecutor) {
   ExecutorCache.set(instance, executor);
}

export function getExecutor(simpleGit: TaskMethods) {
   const executor = ExecutorCache.get(simpleGit);
   if (!executor) {
      throw new Error(`getExecutor(): no registered executor available - GC or Out of Memory`);
   }
   return executor;
}
