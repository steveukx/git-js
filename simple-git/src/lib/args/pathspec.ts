// biome-ignore lint/complexity/noBannedTypes: Object reference required for WeakMap
const cache = new WeakMap<String, string[]>();

export function pathspec(...paths: string[]) {
   const key = new String(paths);
   cache.set(key, paths);

   return key as string;
}

export function isPathSpec(path: string | unknown): path is string {
   return path instanceof String && cache.has(path);
}

export function toPaths(pathSpec: string): string[] {
   return cache.get(pathSpec) || [];
}

export function insertBeforePathsIndex(commands: string[]) {
   const index = commands.indexOf('--');

   return index > -1 ? index : commands.length;
}
