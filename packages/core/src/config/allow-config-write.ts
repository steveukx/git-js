/**
 * Matches a dot-separated git config key against an allow-list whose entries may
 * use `*` as a single-segment wildcard, e.g. `remote.*.url` matches
 * `remote.origin.url` but not `remote.origin.fetch` or `remote.url`.
 */
export function isConfigWriteAllowed(key: string, allowConfigWrite: readonly string[]): boolean {
   const target = key.toLowerCase().split('.');

   return allowConfigWrite.some((pattern) => {
      const segments = pattern.toLowerCase().split('.');
      if (segments.length !== target.length) {
         return false;
      }

      return segments.every((segment, index) => segment === '*' || segment === target[index]);
   });
}
