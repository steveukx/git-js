import { isPathSpec } from '@simple-git/args-pathspec';

import type { Options } from './options.types';

type PrimitiveType = 'boolean' | 'string' | 'number';

export function isPlainObject<T extends Options>(input: T | unknown): input is T {
   return Boolean(input) && Object.prototype.toString.call(input) === '[object Object]';
}

export function isStringArray(input: unknown): input is string[] {
   return Array.isArray(input) && input.every((item) => typeof item === 'string');
}

/**
 * True when `input` is a primitive (or a pathspec, treated as a string) whose
 * type is not in the `omit` list.
 */
export function isPrimitive(input: unknown, omit: PrimitiveType[] = []): boolean {
   const type = isPathSpec(input) ? 'string' : typeof input;
   return /^(string|number|boolean)$/.test(type) && !omit.includes(type as PrimitiveType);
}

export function asStringArray(input: unknown[]): string[] {
   return input.map((value) => String(value));
}
