/**
 * Function that can be used to handle a task's promise resolving
 */
export type SimpleGitTaskResolvedCallback<T, P = void> = (value: T) => P | Promise<P>;

/**
 * Function that can either be used to handle a task's promise rejecting either
 * as the second argument of a `.then(onResolved, onRejected)` or in the
 * explicit exception handler `.catch(onRejected)`.
 */
export type SimpleGitTaskRejectedCallback<E extends Error, P = void> = (error: E) => P | Promise<P>;

/**
 * The node-style callback to a task accepts either two arguments with the first as a null
 * and the second as the data, or just one argument which is an error.
 */
export interface SimpleGitTaskCallback<T = string> {
   (err: null, data: T): void;

   (err: Error): void;
}
