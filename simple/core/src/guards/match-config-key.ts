/**
 * Matches a git config key against an `allowConfigWrite` pattern on a
 * dot-segment basis - `*` matches exactly one segment, so `remote.*.url`
 * matches `remote.origin.url` but neither `remote.url` nor
 * `remote.a.b.url`. Comparison is case-insensitive (git config keys are
 * case-insensitive in their section/key parts and `@simple-git/argv-parser`
 * reports them lower-cased).
 */
export function matchesConfigKey(pattern: string, key: string): boolean {
   const patternSegments = pattern.toLowerCase().split('.');
   const keySegments = key.toLowerCase().split('.');

   if (patternSegments.length !== keySegments.length) {
      return false;
   }

   return patternSegments.every(
      (segment, index) => segment === '*' || segment === keySegments[index]
   );
}

export function matchesAnyConfigKey(allowConfigWrite: readonly string[], key: string): boolean {
   return allowConfigWrite.some((pattern) => matchesConfigKey(pattern, key));
}
