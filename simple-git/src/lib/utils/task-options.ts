import {
   filterArray,
   filterFunction,
   filterPlainObject,
   filterPrimitives,
   filterType,
} from './argument-filters';
import { asFunction, isUserFunction, last } from './util';
import { Maybe, Options, OptionsValues } from '../types';
import { isPathSpec } from '../args/pathspec';

export function appendTaskOptions<T extends Options = Options>(
   options: Maybe<T>,
   commands: string[] = []
): string[] {
   if (!filterPlainObject<Options>(options)) {
      return commands;
   }

   return Object.keys(options).reduce((commands: string[], key: string) => {
      const value: OptionsValues = options[key];

      if (isPathSpec(value)) {
         commands.push(value);
      } else if (filterPrimitives(value, ['boolean'])) {
         commands.push(key + '=' + value);
      } else {
         commands.push(key);
      }

      return commands;
   }, commands);
}

export function getTrailingOptions(
   args: IArguments,
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

function trailingArrayArgument(args: IArguments) {
   const hasTrailingCallback = typeof last(args) === 'function';
   return filterType(last(args, hasTrailingCallback ? 1 : 0), filterArray, []);
}

/**
 * Given any number of arguments, returns the trailing options argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is null.
 */
export function trailingOptionsArgument(args: IArguments): Maybe<Options> {
   const hasTrailingCallback = filterFunction(last(args));
   return filterType(last(args, hasTrailingCallback ? 1 : 0), filterPlainObject);
}

/**
 * Returns either the source argument when it is a `Function`, or the default
 * `NOOP` function constant
 */
export function trailingFunctionArgument(
   args: unknown[] | IArguments | unknown,
   includeNoop = true
): Maybe<(...args: any[]) => unknown> {
   const callback = asFunction(last(args));
   return includeNoop || isUserFunction(callback) ? callback : undefined;
}
