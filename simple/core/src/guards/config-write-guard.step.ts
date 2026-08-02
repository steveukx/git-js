import { type ConfigWrite, parseArgv, parseEnv } from '@simple-git/argv-parser';

import { GitPluginError } from '../errors';
import type { PipelineStep } from '../pipeline/types';
import { matchesAnyConfigKey } from './match-config-key';
import { withoutTrustedConfig } from './trusted-config';

/**
 * Deny-by-default git config write guard (`beforeSpawn` stage - it must see
 * the truly final argv, including `-c` flags injected by the config-prefixing
 * step, and the final child process environment for the `GIT_CONFIG_*` /
 * `--config-env` channels). Every detected write must match an
 * `allowConfigWrite` pattern or the task rejects before anything is spawned.
 * Nothing bypasses the allow-list; config reads are unaffected.
 */
export function configWriteGuardStep(allowConfigWrite: readonly string[]): PipelineStep {
   return {
      name: 'configWriteGuard',
      beforeSpawn(detail) {
         const writes: ConfigWrite[] = [
            ...parseArgv(...withoutTrustedConfig(detail.args)).config.write,
            ...parseEnv(detail.options.env ?? {}).config.write,
         ];

         for (const write of writes) {
            if (!matchesAnyConfigKey(allowConfigWrite, write.key)) {
               throw new GitPluginError(
                  undefined,
                  'allowConfigWrite',
                  `Unsafe git config write of "${write.key}" (scope: ${write.scope}) is blocked - ` +
                     `add a matching pattern to the allowConfigWrite option to permit it`
               );
            }
         }
      },
   };
}
