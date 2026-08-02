import { GitPluginError } from '../errors';
import { createLogger } from '../git-logger';
import type { PipelineStep } from '../pipeline/types';
import { isGuardedEnvKey } from './git-env-keys';

/**
 * Deny-by-default environment filter (`spawnOptions` stage). The executor
 * chain builds the effective environment per task at spawn time from
 * `{ ...ambient, ...executor.env }`; this step then removes every guarded key
 * (see {@link isGuardedEnvKey}) that is not allow-listed via
 * `allowEnvironment`:
 *
 * - a guarded key supplied explicitly through `.env()` rejects the task with
 *   an error naming the key and the option needed to permit it;
 * - a guarded key only inherited from the ambient environment is stripped,
 *   with the removal logged to the `debug` output.
 *
 * Non-guarded variables (`PATH`, `HOME`, ...) always pass through, so `git`
 * runs out of the box.
 */
export function envFilterStep(allowEnvironment: readonly string[]): PipelineStep {
   const allowed = new Set(allowEnvironment.map((key) => key.toLowerCase().trim()));
   const logger = createLogger('', 'env-filter');

   return {
      name: 'envFilter',
      spawnOptions(spawnOptions, context) {
         const env = { ...spawnOptions.env };
         const suppliedKeys = new Set(
            Object.keys(context.env).map((key) => key.toLowerCase().trim())
         );

         for (const key of Object.keys(env)) {
            const normalised = key.toLowerCase().trim();

            // not a GIT_ key, or explicitly permitted
            if (!isGuardedEnvKey(normalised) || allowed.has(normalised)) {
               continue;
            }

            // explicitly throw when simpleGit.env() was called with a guarded key
            if (suppliedKeys.has(normalised)) {
               throw new GitPluginError(
                  undefined,
                  'allowEnvironment',
                  `Use of "${key}" is blocked by the environment guard - add it to the allowEnvironment option to permit it`
               );
            }

            // log and remove guarded keys inherited from the outer environment
            logger(`removing ambient guarded environment variable %s`, key);
            delete env[key];
         }

         return { ...spawnOptions, env };
      },
   };
}
