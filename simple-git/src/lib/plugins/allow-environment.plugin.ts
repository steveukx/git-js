import { isGitEnvKey } from '@simple-git/argv-parser';

import { GitPluginError } from '../errors/git-plugin-error';
import { createLogger } from '../git-logger';
import type { SimpleGitPlugin } from './simple-git-plugin';

export function allowEnvironmentPlugin(
   allowEnvironment: readonly string[]
): SimpleGitPlugin<'spawn.options'> {
   const allowed = new Set(allowEnvironment.map((key) => key.toLowerCase().trim()));
   const logger = createLogger('', 'env-filter');

   return {
      type: 'spawn.options',
      action(spawnOptions, context) {
         const env = { ...(spawnOptions.env ?? process.env) };
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

         // return spawnOptions;
         //
         return { ...spawnOptions, env: { ...env, GIT_TEST_DISALLOW_ABBREVIATED_OPTIONS: 'true' } };
      },
   };
}

function isGuardedEnvKey(key: string) {
   const normalised = key.toLowerCase().trim();
   return normalised.startsWith('git_') || isGitEnvKey(normalised);
}
