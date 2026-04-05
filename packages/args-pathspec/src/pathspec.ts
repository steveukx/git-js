/**
 * Wraps one or more file paths in an object that `parseCli` recognises as
 * explicit pathspecs, routing them to `ParsedCLI.paths` regardless of whether
 * a `--` separator token is present.
 */

// biome-ignore lint/complexity/noBannedTypes: <Uses String object to satisfy WeakMap requiremetn>
const cache = new WeakMap<String, string[]>();

export function pathspec(...paths: string[]): string {
   const key = new String(paths);
   cache.set(key, paths);
   return key as string;
}

export function isPathSpec(value: unknown): value is string {
   return value instanceof String && cache.has(value);
}

export function toPaths(value: string): string[] {
   return cache.get(value) ?? [];
}
