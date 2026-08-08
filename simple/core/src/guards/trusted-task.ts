import { TRUSTED_TASK } from '../symbols';

/**
 * Deliberately **not** re-exported from the public barrel. `src/tasks` is
 * exported wholesale, so these live here instead - a consumer able to call
 * `trustedTask()` could brand any object and skip the shape validation
 * entirely, which is the one thing the mark exists to prevent.
 */

/**
 * Brands a task descriptor as built by this package. The mark is a
 * non-enumerable, non-writable own property, so it survives neither a spread
 * (`{ ...task }` re-brands deliberately, never accidentally) nor serialisation,
 * and cannot be forged by an object that did not pass through this function.
 */
export function trustedTask<T extends object>(task: T): T {
   return Object.defineProperty(task, TRUSTED_TASK, {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false,
   });
}

/**
 * True only for a descriptor branded by {@link trustedTask}. The mark must be
 * an *own* property - inheriting it through `Object.create(trustedTask(…))`
 * does not confer trust.
 */
export function isTrustedTask(task: unknown): boolean {
   if (!task || (typeof task !== 'object' && typeof task !== 'function')) {
      return false;
   }

   return Object.getOwnPropertyDescriptor(task, TRUSTED_TASK)?.value === true;
}
