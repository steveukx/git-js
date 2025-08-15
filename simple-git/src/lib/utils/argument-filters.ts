import { isPathSpec } from '../args/pathspec';
import type { Maybe, Options, Primitives } from '../types';
import { objectToString } from './util';

export type ArgumentFilterPredicate<T> = (input: T | unknown) => input is T;

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

export const filterArray: ArgumentFilterPredicate<Array<unknown>> = (
   input
): input is Array<unknown> => {
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

export const filterNumber: ArgumentFilterPredicate<number> = (input: unknown): input is number => {
   return typeof input === 'number';
};

export const filterString: ArgumentFilterPredicate<string> = (input: unknown): input is string => {
   return typeof input === 'string';
};

export const filterStringOrStringArray: ArgumentFilterPredicate<string | string[]> = (
   input
): input is string | string[] => {
   return filterString(input) || (Array.isArray(input) && input.every(filterString));
};

export function filterPlainObject<T extends Options>(input: T | unknown): input is T;
export function filterPlainObject<T extends Record<string, unknown>>(
   input: T | unknown
): input is T {
   return !!input && objectToString(input) === '[object Object]';
}

export function filterFunction(input: unknown): input is (...args: unknown[]) => unknown {
   return typeof input === 'function';
}

export const filterHasLength: ArgumentFilterPredicate<{ length: number }> = (
   input
): input is { length: number } => {
   if (input == null || 'number|boolean|function'.includes(typeof input)) {
      return false;
   }

   return typeof (input as { length?: number }).length === 'number';
};
