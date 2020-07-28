import { exists, FOLDER } from '@kwsites/file-exists';

export const NOOP: (...args: any[]) => void = () => {
};

/**
 * Returns either the source argument when it is a `Function`, or the default
 * `NOOP` function constant
 */
export function asFunction<T extends Function>(source: T | any): T {
   return typeof source === 'function' ? source : NOOP;
}

/**
 * Determines whether the supplied argument is both a function, and is not
 * the `NOOP` function.
 */
export function isUserFunction<T extends Function>(source: T | any): source is T {
   return (typeof source === 'function' && source !== NOOP);
}

export function splitOn(input: string, char: string): [string, string] {
   const index = input.indexOf(char);
   if (index <= 0) {
      return [input, ''];
   }

   return [
      input.substr(0, index),
      input.substr(index + 1),
   ];
}

export function last<T>(input: T[]): T | undefined {
   return input && input.length ? input[input.length - 1] : undefined;
}

export function toLinesWithContent(input: string, trimmed = true): string[] {
   return input.split('\n')
      .reduce((output, line) => {
         const lineContent = trimmed ? line.trim() : line;
         if (lineContent) {
            output.push(lineContent);
         }
         return output;
      }, [] as string[]);
}

type LineWithContentCallback<T = void> = (line: string) => T;

export function forEachLineWithContent<T>(input: string, callback: LineWithContentCallback<T>): T[] {
   return toLinesWithContent(input, true).map(line => callback(line));
}

export function folderExists(path: string): boolean {
   return exists(path, FOLDER);
}

/**
 * Adds `item` into the `target` `Array` or `Set` when it is not already present.
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

export const objectToString = Object.prototype.toString.call.bind(Object.prototype.toString) as (input: any) => string;

export function asArray<T>(source: T | T[]): T[] {
   return Array.isArray(source) ? source : [source];
}

export function asStringArray<T>(source: T | T[]): string[] {
   return asArray(source).map(String);
}

export function asNumber(source: string, onNaN = 0) {
   const num = parseInt(source, 10);
   return isNaN(num) ? onNaN : num;
}
