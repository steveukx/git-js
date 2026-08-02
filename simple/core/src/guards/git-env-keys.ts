import { isGitEnvKey } from '@simple-git/argv-parser';

/**
 * A guarded environment variable is any `GIT_`-prefixed key plus the curated
 * set of known-vulnerable keys git honours without the prefix (eg `EDITOR`,
 * `PAGER`) - sourced from `@simple-git/argv-parser`'s `GitEnvKeys` so there is
 * a single list to maintain. Guarded keys are stripped from the child process
 * environment unless explicitly allow-listed via `allowEnvironment`.
 */
export function isGuardedEnvKey(key: string): boolean {
   const normalised = key.toLowerCase().trim();
   return normalised.startsWith('git_') || isGitEnvKey(normalised);
}
