import { Maybe, Primitives } from './types';
import { asFunction, isUserFunction, objectToString } from './util';
import { Options, SimpleGitTaskCallback } from '../types';

export interface ArgumentFilterPredicate {
   (input: any): boolean;
}

export function filterType<T>(input: T | any, ...filters: ArgumentFilterPredicate[]): Maybe<T> {
   return filters.some((filter) => filter(input)) ? input : undefined;
}

export const filterArray: ArgumentFilterPredicate = (input): input is Array<any> => {
   return Array.isArray(input);
}

export const filterPrimitives: ArgumentFilterPredicate = (input): input is Primitives => {
   return /number|string|boolean/.test(typeof input);
}

export const filterString: ArgumentFilterPredicate = (input): input is string => {
   return typeof input === 'string';
};

export const filterPlainObject: ArgumentFilterPredicate = (input): input is Object => {
   return !!input && objectToString(input) === '[object Object]';
}

export const filterFunction: ArgumentFilterPredicate = (input): input is Function => {
   return typeof input === 'function';
}

export const filterHasLength: ArgumentFilterPredicate = (input) => {
   if (input == null) {
      return false;
   }

   const hasLength = typeof input === 'string' || (typeof input === 'object' && ('length' in input));

   return hasLength && typeof input.length === 'number';
}

/**
 * Given any number of arguments, returns the trailing options array argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is an empty array.
 */
export function trailingArrayArgument(args: any[] | IArguments): any[] {
   const hasTrailingCallback = filterFunction(args[args.length - 1]);
   const options = args[args.length - (hasTrailingCallback ? 2 : 1)];

   return filterType(options, filterArray) || [];
}

/**
 * Given any number of arguments, returns the trailing options argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is `undefined`.
 */
export function trailingOptionsArgument(args: any[] | IArguments): Maybe<Options> {
   const hasTrailingCallback = filterFunction(args[args.length - 1]);
   const options = args[args.length - (hasTrailingCallback ? 2 : 1)];

   return filterType(options, filterPlainObject);
}

/**
 * Given any number of arguments, returns the last argument if it is a function, otherwise returns null.
 * @returns {Function|null}
 */
export function trailingUserFunctionArgument(args: any[] | IArguments): Maybe<SimpleGitTaskCallback> {
   return filterType(args[args.length - 1], isUserFunction);
}

/**
 * Given any number of arguments, returns the last argument if it is a function, otherwise returns null.
 * @returns {Function|null}
 */
export function trailingFunctionArgument(args: any[] | IArguments): SimpleGitTaskCallback {
   return asFunction(args[args.length - 1]);
}

/**
 * Appends a trailing object, and trailing array of options to a new array and returns that array.
 */
export function getTrailingOptions(args: any[] | IArguments, includeInitialPrimitive = false) {
   return [
      ...primitiveToCommands(args, includeInitialPrimitive),
      ...optionsToCommands(trailingOptionsArgument(args)),
      ...trailingArrayArgument(args),
   ];
}


/**
 * Mutates the supplied command array by merging in properties in the options object. When the
 * value of the item in the options object is a string it will be concatenated to the key as
 * a single `name=value` item, otherwise just the name will be used.
 */
export function appendTaskOptions(command: string[], options: Maybe<Options>) {
   command.push(...optionsToCommands(options));
}

/**
 * Create a commands array of either the first element of the supplied arguments
 * array if it is a primitive (and includeInitialPrimitive is true), otherwise an
 * empty array is returned.
 */
function primitiveToCommands(args: any[] | IArguments, includeInitialPrimitive: boolean): string[] {
   if (!args.length || !includeInitialPrimitive || !filterPrimitives(args[0])) {
      return [];
   }

   return [args[0]];
}

/**
 * Create a commands array from the supplied options object, when not an object
 * an empty array is returned.
 */
function optionsToCommands(options: Maybe<Options>): string[] {
   const commands = [];

   if (options) {
      for (const [key, value] of Object.entries(options)) {
         commands.push(
            typeof value === 'string' ? `${key}=${value}` : key
         );
      }
   }

   return commands;
}
