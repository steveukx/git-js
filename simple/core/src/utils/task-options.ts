import { isPathSpec } from '@simple-git/args-pathspec';

import { isTrustedConfig } from '../guards/trusted-config';
import type { Maybe, Options } from '../types';
import { filterArray, filterPlainObject, filterPrimitives, filterType } from './argument-filters';
import { asStringArray, last } from './util';

/**
 * The arguments supplied to a task method - trailing callback functions are
 * not supported (they throw before reaching these helpers), so unlike v3 there
 * is no need to skip over a trailing function when finding the options.
 */
export type ArgumentsLike = unknown[] | IArguments;

export function appendTaskOptions<T extends Options = Options>(
   options: Maybe<T>,
   commands: string[] = []
): string[] {
   if (!filterPlainObject<Options>(options)) {
      return commands;
   }

   return Object.keys(options).reduce((commands: string[], key: string) => {
      const value = options[key];

      if (isSpecialString(value)) {
         commands.push(value);
      } else if (filterPrimitives(value, ['boolean'])) {
         commands.push(`${key}=${value}`);
      } else if (Array.isArray(value)) {
         for (const v of value) {
            if (!filterPrimitives(v, ['string', 'number'])) {
               commands.push(`${key}=${v}`);
            }
         }
      } else {
         commands.push(key);
      }

      return commands;
   }, commands);
}

export function getTrailingOptions(
   args: ArgumentsLike,
   initialPrimitive = 0,
   objectOnly = false
): string[] {
   const command: string[] = [];

   for (let i = 0, max = initialPrimitive < 0 ? args.length : initialPrimitive; i < max; i++) {
      if ('string|number'.includes(typeof args[i])) {
         command.push(String(args[i]));
      }
   }

   appendTaskOptions(trailingOptionsArgument(args), command);
   if (!objectOnly) {
      command.push(...trailingArrayArgument(args));
   }

   return command;
}

function trailingArrayArgument(args: ArgumentsLike) {
   return asStringArray(filterType(last(args), filterArray, []));
}

/**
 * Given any number of arguments, returns the trailing options argument when
 * there is one. When not found, the return value is `undefined`.
 */
export function trailingOptionsArgument(args: ArgumentsLike): Maybe<Options> {
   return filterType(last(args), filterPlainObject);
}

/**
 * "Blessed" strings can be passed through as any regular `string`, but are
 * String object instances, recognised by the TrustedConfig and PathSpec plugins
 */
function isSpecialString(input: unknown): input is string {
   return isPathSpec(input) || isTrustedConfig(input);
}
