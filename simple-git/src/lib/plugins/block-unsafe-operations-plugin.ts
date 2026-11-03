import {
   configKeyMatcher,
   isSafeConfigKey,
   parseArgv,
   parseEnv,
   type Vulnerability,
} from '@simple-git/argv-parser';

import { GitPluginError } from '../errors/git-plugin-error';
import { createLogger } from '../git-logger';
import type { SimpleGitPluginConfig } from '../types';
import type { SimpleGitPlugin } from './simple-git-plugin';

const logger = createLogger('', 'plugin:unsafe');

/**
 * Environment variables that cannot be permitted by `allowEnvironment` alone, because the
 * configuration they carry cannot be checked against the `allowConfig` list.
 */
const OPAQUE_ENV_KEYS = new Set(['git_config_parameters']);

/** Config keys already warned about in this process, warnings are only emitted once per key. */
const warnedConfigKeys = new Set<string>();

export interface BlockUnsafeOperationsOptions {
   unsafe?: SimpleGitPluginConfig['unsafe'];
   allowConfig?: SimpleGitPluginConfig['allowConfig'];
   allowEnvironment?: SimpleGitPluginConfig['allowEnvironment'];
   strictConfig?: SimpleGitPluginConfig['strictConfig'];
}

export function blockUnsafeOperationsPlugin({
   unsafe = {},
   allowConfig = [],
   allowEnvironment = [],
   strictConfig = false,
}: BlockUnsafeOperationsOptions = {}): SimpleGitPlugin<'spawn.args'> {
   const isAllowedConfig = configKeyMatcher(allowConfig);
   const allowedEnv = new Set(allowEnvironment.map((key) => key.toLowerCase().trim()));

   function isPermitted(vulnerability: Vulnerability) {
      if (unsafe[vulnerability.category] === true) {
         return true;
      }

      if (vulnerability.configKey !== undefined) {
         return isAllowedConfig(vulnerability.configKey);
      }

      if (vulnerability.envKey !== undefined) {
         return !OPAQUE_ENV_KEYS.has(vulnerability.envKey) && allowedEnv.has(vulnerability.envKey);
      }

      return false;
   }

   return {
      type: 'spawn.args',
      action(args, { env }) {
         const argv = parseArgv(...args);
         const environment = parseEnv(env ?? {});
         const checked = new Set<string>();

         for (const vulnerability of [...argv.vulnerabilities, ...environment.vulnerabilities]) {
            if (vulnerability.configKey !== undefined) {
               checked.add(vulnerability.configKey);
            }

            if (!isPermitted(vulnerability)) {
               throw new GitPluginError(undefined, 'unsafe', blockedMessage(vulnerability));
            }
         }

         for (const { key } of [...argv.config.write, ...environment.config.write]) {
            if (checked.has(key) || isSafeConfigKey(key) || isAllowedConfig(key)) {
               continue;
            }

            if (strictConfig) {
               throw new GitPluginError(
                  undefined,
                  'allowConfig',
                  `Configuring "${key}" is not permitted without adding it to the allowConfig option`
               );
            }

            warnUnlistedConfig(key);
         }

         return args;
      },
   };
}

function blockedMessage({ message, configKey, envKey }: Vulnerability) {
   if (configKey !== undefined) {
      return `${message} or adding "${configKey}" to the allowConfig option`;
   }
   if (envKey !== undefined && !OPAQUE_ENV_KEYS.has(envKey)) {
      return `${message} or adding "${envKey.toUpperCase()}" to the allowEnvironment option`;
   }
   return message;
}

function warnUnlistedConfig(key: string) {
   logger(`config key %s is not in the allowConfig list`, key);
   if (warnedConfigKeys.has(key)) {
      return;
   }

   warnedConfigKeys.add(key);
   process.emitWarning(
      `simple-git: configuration key "${key}" is not in the list of known-safe keys. Add it to the ` +
         `allowConfig option to keep using it, it will be blocked by default in the next major version.`,
      { code: 'SIMPLE_GIT_UNLISTED_CONFIG' }
   );
}
