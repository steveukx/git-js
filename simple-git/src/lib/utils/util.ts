import { exists, FOLDER } from '@kwsites/file-exists';
import { Maybe } from '../types';

export const NULL = '\0';

export const NOOP: (...args: any[]) => void = () => {};

/**
 * Returns either the source argument when it is a `Function`, or the default
 * `NOOP` function constant
 */
export function asFunction<T extends () => any>(source: T | any): T {
   return typeof source === 'function' ? source : NOOP;
}

/**
 * Determines whether the supplied argument is both a function, and is not
 * the `NOOP` function.
 */
export function isUserFunction<T extends Function>(source: T | any): source is T {
   return typeof source === 'function' && source !== NOOP;
}

export function splitOn(input: string, char: string): [string, string] {
   const index = input.indexOf(char);
   if (index <= 0) {
      return [input, ''];
   }

   return [input.substr(0, index), input.substr(index + 1)];
}

export function first<T extends any[]>(input: T, offset?: number): Maybe<T[number]>;
export function first<T extends IArguments>(input: T, offset?: number): Maybe<unknown>;
export function first(input: any[] | IArguments, offset = 0): Maybe<unknown> {
   return isArrayLike(input) && input.length > offset ? input[offset] : undefined;
}

export function last<T extends any[]>(input: T, offset?: number): Maybe<T[number]>;
export function last<T extends IArguments>(input: T, offset?: number): Maybe<unknown>;
export function last<T>(input: T, offset?: number): Maybe<unknown>;
export function last(input: unknown, offset = 0) {
   if (isArrayLike(input) && input.length > offset) {
      return input[input.length - 1 - offset];
   }
}

type ArrayLike<T = any> = T[] | IArguments | { [index: number]: T; length: number };

function isArrayLike(input: any): input is ArrayLike {
   return !!(input && typeof input.length === 'number');
}

export function toLinesWithContent(input = '', trimmed = true, separator = '\n'): string[] {
   return input.split(separator).reduce((output, line) => {
      const lineContent = trimmed ? line.trim() : line;
      if (lineContent) {
         output.push(lineContent);
      }
      return output;
   }, [] as string[]);
}

type LineWithContentCallback<T = void> = (line: string) => T;

export function forEachLineWithContent<T>(
   input: string,
   callback: LineWithContentCallback<T>
): T[] {
   return toLinesWithContent(input, true).map((line) => callback(line));
}

export function folderExists(path: string): boolean {
   return exists(path, FOLDER);
}

/**
 * Adds `item` into the `target` `Array` or `Set` when it is not already present and returns the `item`.
 */
export function append<T>(target: T[] | Set<T>, item: T): typeof item {
   if (Array.isArray(target)) {
      if (!target.includes(item)) {
         target.push(item);
      }
   } else {
      target.add(item);
   }
   return item;
}

/**
 * Adds `item` into the `target` `Array` when it is not already present and returns the `target`.
 */
export function including<T>(target: T[], item: T): typeof target {
   if (Array.isArray(target) && !target.includes(item)) {
      target.push(item);
   }

   return target;
}

export function remove<T>(target: Set<T> | T[], item: T): T {
   if (Array.isArray(target)) {
      const index = target.indexOf(item);
      if (index >= 0) {
         target.splice(index, 1);
      }
   } else {
      target.delete(item);
   }
   return item;
}

export const objectToString = Object.prototype.toString.call.bind(Object.prototype.toString) as (
   input: any
) => string;

export function asArray<T>(source: T | T[]): T[] {
   return Array.isArray(source) ? source : [source];
}

export function asCamelCase(str: string) {
   return str.replace(/[\s-]+(.)/g, (_all, chr) => {
      return chr.toUpperCase();
   });
}

export function asStringArray<T>(source: T | T[]): string[] {
   return asArray(source).map(String);
}

export function asNumber(source: string | null | undefined, onNaN = 0) {
   if (source == null) {
      return onNaN;
   }

   const num = parseInt(source, 10);
   return isNaN(num) ? onNaN : num;
}

export function prefixedArray<T>(input: T[], prefix: T): T[] {
   const output: T[] = [];
   for (let i = 0, max = input.length; i < max; i++) {
      output.push(prefix, input[i]);
   }
   return output;
}

export function bufferToString(input: Buffer | Buffer[]): string {
   return (Array.isArray(input) ? Buffer.concat(input) : input).toString('utf-8');
}

/**
 * Get a new object from a source object with only the listed properties.
 */
export function pick(source: Record<string, any>, properties: string[]) {
   return Object.assign(
      {},
      ...properties.map((property) => (property in source ? { [property]: source[property] } : {}))
   );
}

export function delay(duration = 0): Promise<void> {
   return new Promise((done) => setTimeout(done, duration));
}

export function orVoid<T>(input: T | false) {
   if (input === false) {
      return undefined;
   }
   return input;
}
