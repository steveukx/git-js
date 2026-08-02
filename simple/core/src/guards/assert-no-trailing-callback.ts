import { TaskConfigurationError } from '../errors';

/**
 * Trailing callback arguments are not supported by `@simple-git/core` - every
 * bound task method plus `run` / `raw` / `stream` throw this loud, documented
 * error rather than silently ignoring the function. Methods that legitimately
 * accept a function payload (`exec`, `outputHandler`) do not apply this guard.
 */
export function assertNoTrailingCallback(args: ArrayLike<unknown>): void {
   if (args.length && typeof args[args.length - 1] === 'function') {
      throw new TaskConfigurationError(
         '@simple-git/core does not support trailing callback arguments. Use the returned promise instead.'
      );
   }
}
