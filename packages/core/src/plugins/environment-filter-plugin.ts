import { isGuardedEnvKey } from '../config/git-env-keys';
import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPlugin } from './plugin.types';

/**
 * Deny-by-default environment filter (runs per task at `spawn.options`).
 *
 * The effective environment is assembled at spawn time from the ambient
 * environment plus anything supplied via `.env(...)`; every guarded key (the
 * `GIT_*` family and the non-prefixed variables git honours) is then removed
 * unless it is allow-listed via `allowEnvironment`. Ambient keys are stripped
 * silently, but a key the caller explicitly supplied via `.env(...)` fails *the
 * task* loudly, naming the key and the option needed to permit it.
 */
export function environmentFilterPlugin(
   allowEnvironment: readonly string[]
): SimpleGitPlugin<'spawn.options'> {
   const allow = new Set(allowEnvironment);

   return {
      type: 'spawn.options',
      action(options, context) {
         for (const key of Object.keys(context.env ?? {})) {
            if (isGuardedEnvKey(key) && !allow.has(key)) {
               throw new GitPluginError(
                  undefined,
                  'allowEnvironment',
                  `simple-git: the environment variable "${key}" is blocked by default in v4; ` +
                     `add it to the "allowEnvironment" option to pass it through to git.`
               );
            }
         }

         const env: NodeJS.ProcessEnv = {};
         for (const [key, value] of Object.entries(options.env)) {
            if (isGuardedEnvKey(key) && !allow.has(key)) {
               continue;
            }
            env[key] = value;
         }

         return { ...options, env };
      },
   };
}
