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
