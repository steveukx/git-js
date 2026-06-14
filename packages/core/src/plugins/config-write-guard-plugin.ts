import { parseArgv } from '@simple-git/argv-parser';

import { isConfigWriteAllowed } from '../config/allow-config-write';
import { blessedConfigIntent, isBlessedConfig } from '../config/bless-config';
import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPlugin } from './plugin.types';

/**
 * Deny-by-default config-write guard (runs at `spawn.args`, after the
 * config-prefixing plugin so it sees caller-injected `-c` flags).
 *
 * Every config *write* the command would perform — via `-c`, `config set`/
 * `config <key> <value>`, `--unset`, `--config-env`, … — is detected by reusing
 * `@simple-git/argv-parser`, then vetted against `allowConfigWrite`. Writes a
 * task blessed for itself (see `blessConfig`) are exempt; nothing else is.
 */
export function configWriteGuardPlugin(
   allowConfigWrite: readonly string[]
): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args) {
         const blessedKeys = collectBlessedKeys(args);
         const tokens = args.map((arg) => String(arg));

         for (const write of parseArgv(...tokens).config.write) {
            if (blessedKeys.has(write.key.toLowerCase())) {
               continue;
            }

            if (!isConfigWriteAllowed(write.key, allowConfigWrite)) {
               throw new GitPluginError(
                  undefined,
                  'allowConfigWrite',
                  `simple-git: writing git config "${write.key}" is blocked by default in v4; ` +
                     `add it (or a matching wildcard) to the "allowConfigWrite" option to permit it.`
               );
            }
         }

         return args;
      },
   };
}

function collectBlessedKeys(args: string[]): Set<string> {
   const keys = new Set<string>();

   for (let index = 0; index < args.length - 1; index++) {
      if (args[index] === '-c' && isBlessedConfig(args[index + 1])) {
         const intent = blessedConfigIntent(args[index + 1]);
         if (intent) {
            keys.add(intent.key.toLowerCase());
         }
      }
   }

   return keys;
}
