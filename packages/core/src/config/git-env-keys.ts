/**
 * Environment variables git honours that can change which code it executes or
 * how it authenticates. These are stripped from a child process's environment
 * unless explicitly allow-listed via `allowEnvironment`. The `GIT_`-prefixed
 * family is matched by prefix; this set adds the non-prefixed variables git also
 * honours (e.g. `EDITOR`, `PAGER`) which would otherwise slip through.
 */
export const GitEnvKeys: ReadonlySet<string> = new Set([
   'EDITOR',
   'PAGER',
   'SSH_ASKPASS',
   'GIT_ASKPASS',
   'GIT_CONFIG',
   'GIT_CONFIG_GLOBAL',
   'GIT_CONFIG_SYSTEM',
   'GIT_CONFIG_COUNT',
   'GIT_CONFIG_PARAMETERS',
   'GIT_EDITOR',
   'GIT_EXTERNAL_DIFF',
   'GIT_PAGER',
   'GIT_PROXY_COMMAND',
   'GIT_SSH',
   'GIT_SSH_COMMAND',
   'GIT_TERMINAL_PROMPT',
]);

/** True when `key` is a git-honoured environment variable subject to the allow-list. */
export function isGuardedEnvKey(key: string): boolean {
   return key.startsWith('GIT_') || GitEnvKeys.has(key);
}
