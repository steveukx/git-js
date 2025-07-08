import { Maybe, Options, Primitives } from '../types';
import { objectToString } from './util';
import { isPathSpec } from '../args/pathspec';

export interface ArgumentFilterPredicate<T> {
   (input: any): input is T;
}

export function filterType<T, K>(
   input: K,
   filter: ArgumentFilterPredicate<T>
): K extends T ? T : undefined;
export function filterType<T, K>(input: K, filter: ArgumentFilterPredicate<T>, def: T): T;
export function filterType<T, K>(input: K, filter: ArgumentFilterPredicate<T>, def?: T): Maybe<T> {
   if (filter(input)) {
      return input;
   }
   return arguments.length > 2 ? def : undefined;
}

export const filterArray: ArgumentFilterPredicate<Array<any>> = (input): input is Array<any> => {
   return Array.isArray(input);
};

export function filterPrimitives(
   input: unknown,
   omit?: Array<'boolean' | 'string' | 'number'>
): input is Primitives {
   const type = isPathSpec(input) ? 'string' : typeof input;

   return (
      /number|string|boolean/.test(type) &&
      (!omit || !omit.includes(type as 'boolean' | 'string' | 'number'))
   );
}

export const filterString: ArgumentFilterPredicate<string> = (input): input is string => {
   return typeof input === 'string';
};

export const filterStringArray: ArgumentFilterPredicate<string[]> = (input): input is string[] => {
   return Array.isArray(input) && input.every(filterString);
};

export const filterStringOrStringArray: ArgumentFilterPredicate<string | string[]> = (
   input
): input is string | string[] => {
   return filterString(input) || (Array.isArray(input) && input.every(filterString));
};

export function filterPlainObject<T extends Options>(input: T | unknown): input is T;
export function filterPlainObject<T extends Object>(input: T | unknown): input is T {
   return !!input && objectToString(input) === '[object Object]';
}

export function filterFunction(input: unknown): input is Function {
   return typeof input === 'function';
}

export const filterHasLength: ArgumentFilterPredicate<{ length: number }> = (
   input
): input is { length: number } => {
   if (input == null || 'number|boolean|function'.includes(typeof input)) {
      return false;
   }
   return Array.isArray(input) || typeof input === 'string' || typeof input.length === 'number';
};
