/**
 * Module-private symbols. Neither of these is re-exported from the public
 * barrel, so the only way to hold one is to be part of this package - which is
 * what makes them usable as a trust boundary. A task descriptor arriving as
 * plain data (parsed JSON, a config file, an untrusted plugin) can carry any
 * string-keyed property it likes, but it can never carry these.
 */

/**
 * Marks a task descriptor as built by this package and therefore exempt from
 * the shape validation applied to caller-supplied tasks - see
 * {@link import('./guards/assert-task-shape').validateTaskShape}.
 */
export const TRUSTED_TASK: unique symbol = Symbol('simple-git.trustedTask');
