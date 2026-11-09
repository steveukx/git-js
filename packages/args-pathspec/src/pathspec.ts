// biome-ignore lint/complexity/noBannedTypes: <Uses String object to satisfy WeakMap requiremetn>
const cache = new WeakMap<String, string[]>();

/**
 * Wraps one or more file paths to be passed to `git` as explicit pathspec arguments, these are
 * always added after a `--` separator so can never be interpreted as options.
 *
 * ```typescript
 * import { pathspec, simpleGit } from 'simple-git';
 *
 * const git = simpleGit();
 * const status = await git.status([pathspec('sub-dir')]);
 * await git.cmd`checkout main -- ${pathspec(file)}`;
 * ```
 */
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
