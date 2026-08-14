import { TaskConfigurationError } from '../errors';
import type { Maybe } from '../types';
import { isTrustedTask } from './trusted-task';

/**
 * The complete set of properties a caller-supplied task descriptor may carry.
 * `onStream` is deliberately absent - see {@link validateTaskShape}.
 */
const ALLOWED_PROPERTIES = new Set(['commands', 'format', 'parser', 'onError']);

/**
 * `empty` is deliberately absent - an empty task bypasses the child process
 * and is handed the live executor as its parser argument, which is not a
 * capability a caller-supplied descriptor may claim.
 */
const ALLOWED_FORMATS = new Set(['utf-8', 'buffer']);

/**
 * Validates the shape of a task descriptor supplied by a caller, returning the
 * reason it was rejected or `undefined` when it is safe to run.
 *
 * Types alone are not enough here: `git.run()`, `git.raw()` and `git.stream()`
 * all accept a descriptor built outside this package, and a value reaching
 * them at runtime may be anything at all. Every property the executor and the
 * task pipeline read is therefore checked against what it is about to be used
 * for:
 *
 * - **no unknown properties** - a descriptor carrying anything beyond the four
 *   allowed keys is rejected rather than passed on to a pipeline step that
 *   might one day read it;
 * - **`onStream` is never accepted** - it is the hook `git.stream()` installs
 *   to divert `stdOut`, and supplying it suppresses the accumulation the
 *   parser depends on (see `execute-remote-task`), so only the wrapper built
 *   inside `stream()` may set it;
 * - **`parser` must be a function** - it is called with the process output;
 * - **`format` must be `utf-8` or `buffer`** - it selects how that output is
 *   decoded before the parser sees it;
 * - **`commands` must be a non-empty array** - an empty list would route the
 *   task down the empty-task path, which hands the parser the live executor.
 *
 * The *contents* of `commands` are deliberately not constrained here. Entries
 * may legitimately be `pathspec()` wrappers (`String` objects) rather than
 * primitives, and what an argument means is the task pipeline's business:
 * `parseArgv` coerces every entry before the config-write and unsafe-operation
 * guards inspect it, so a non-primitive cannot smuggle a flag past them.
 *
 * Descriptors branded by `trustedTask()` are built by this package and skip
 * these checks - they are the only ones permitted to use the `empty` format or
 * to set `onStream`.
 */
export function validateTaskShape(task: unknown): Maybe<string> {
   if (isTrustedTask(task)) {
      return undefined;
   }

   if (!task || typeof task !== 'object' || Array.isArray(task)) {
      return 'task must be supplied as a task configuration object';
   }

   // the own-property sweep below only sees own keys, so a descriptor is
   // required to be a plain object - otherwise anything unexpected could be
   // parked on a prototype where the sweep would not find it
   const prototype = Object.getPrototypeOf(task);
   if (prototype !== Object.prototype && prototype !== null) {
      return 'task must be supplied as a plain object';
   }

   for (const key of Reflect.ownKeys(task)) {
      if (key === 'onStream') {
         return 'task must not supply an onStream handler, use git.stream to stream a task';
      }

      if (typeof key === 'symbol' || !ALLOWED_PROPERTIES.has(key)) {
         return `task must not supply the unsupported property "${String(key)}"`;
      }
   }

   const { commands, format, parser, onError } = task as Record<string, unknown>;

   // format is checked ahead of commands so that a descriptor claiming the
   // internal `empty` format is told precisely that, rather than being
   // reported for the empty command list that goes with it
   if (typeof format !== 'string' || !ALLOWED_FORMATS.has(format)) {
      return `task format must be one of ${[...ALLOWED_FORMATS].join(' / ')}`;
   }

   if (typeof parser !== 'function') {
      return 'task must supply a parser function';
   }

   if (!Array.isArray(commands) || !commands.length) {
      return 'task must supply a non-empty commands array';
   }

   if (
      commands.some(
         (command) =>
            !(
               typeof command === 'string' ||
               typeof command === 'number' ||
               command instanceof String
            )
      )
   ) {
      return 'task must supply only string or number arguments';
   }

   if (onError !== undefined && typeof onError !== 'function') {
      return 'task onError must be supplied as a function';
   }

   return undefined;
}

/**
 * `validateTaskShape` as the error the failure should reject with, ready to be
 * handed to `configurationErrorTask` so it surfaces through the instance
 * rather than throwing at the call site.
 */
export function taskShapeError(task: unknown): Maybe<TaskConfigurationError> {
   const message = validateTaskShape(task);

   return message === undefined ? undefined : new TaskConfigurationError(message);
}
