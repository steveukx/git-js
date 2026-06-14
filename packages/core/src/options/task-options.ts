import { isPathSpec } from '@simple-git/args-pathspec';

import { asStringArray, isPlainObject, isPrimitive } from './argument-filters';
import type { Maybe, Options, VariadicOptions } from './options.types';

/**
 * Renders an {@link Options} object onto `commands`, following git's flag
 * conventions: a pathspec or `null` value becomes a bare flag, a string/number
 * becomes `key=value`, and an array becomes one `key=value` per entry.
 */
export function appendOptions(options: Maybe<Options>, commands: string[] = []): string[] {
   if (!isPlainObject(options)) {
      return commands;
   }

   for (const key of Object.keys(options)) {
      const value = options[key];

      if (isPathSpec(value)) {
         commands.push(String(value));
      } else if (isPrimitive(value, ['boolean'])) {
         commands.push(`${key}=${value}`);
      } else if (Array.isArray(value)) {
         for (const entry of value) {
            if (isPrimitive(entry, ['boolean'])) {
               commands.push(`${key}=${entry}`);
            }
         }
      } else {
         commands.push(key);
      }
   }

   return commands;
}

/**
 * Normalises the flexible trailing-options a task accepts — any mix of varargs
 * strings, string[] passthroughs, and {@link Options} objects — into a flat
 * array of git arguments, preserving the order in which they were supplied.
 */
export function asTaskOptions<O extends Options = Options>(
   options: VariadicOptions<O> = []
): string[] {
   const commands: string[] = [];

   for (const option of options) {
      if (typeof option === 'string' || typeof option === 'number') {
         commands.push(String(option));
      } else if (Array.isArray(option)) {
         commands.push(...asStringArray(option));
      } else if (isPlainObject(option)) {
         appendOptions(option, commands);
      }
   }

   return commands;
}
