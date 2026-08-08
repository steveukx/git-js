import type { ChainedResponse, SimpleGitCore } from '../git';
import { taskShapeError } from '../guards/assert-task-shape';
import { configurationErrorTask, type GitTask } from '../tasks';
import type { SimpleGitExecutor } from '../types';
import { NOOP } from '../utils';
import { getExecutor, setExecutor } from './executor-cache';

/**
 * Queues one task on a new executor chain. Symbol-keyed rather than named
 * `_runTask`, so there is no string property through which a caller could
 * reach the executor with a descriptor that has not been vetted - every
 * public entry point either validates its task here or supplies one built
 * inside this package.
 */
export function runTask<R>(simpleGit: SimpleGitCore, task: GitTask<R>): ChainedResponse<R> {
   const invalid = taskShapeError(task);
   const chain = getExecutor(simpleGit).chain();

   return chainedTask(
      simpleGit,
      chain,
      chain.push(invalid ? configurationErrorTask(invalid) : task)
   );
}

export function chainedTask<R>(
   simpleGit: SimpleGitCore,
   chain: SimpleGitExecutor,
   promise: Promise<unknown>
): ChainedResponse<R> {
   markHandled(promise);

   const next: ChainedResponse<R> = Object.create(simpleGit, {
      then: { value: promise.then.bind(promise) },
      catch: { value: promise.catch.bind(promise) },
   });

   setExecutor(next, chain);

   return next;
}

/**
 * Subscribes a no-op rejection handler so a task fired without an immediate
 * `await` / `.catch` doesn't trigger an unhandled rejection - the same
 * semantics v3's always-attached callback plumbing gave every task. The
 * original promise is returned, so callers still receive the rejection.
 */
function markHandled<T extends Promise<unknown>>(promise: T): T {
   promise.catch(NOOP);
   return promise;
}
