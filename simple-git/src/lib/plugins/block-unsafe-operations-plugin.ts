import type { SimpleGitPlugin } from './simple-git-plugin';

import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../types';

function isConfigSwitch(arg: string | unknown) {
   return typeof arg === 'string' && arg.trim().toLowerCase() === '-c';
}

function preventProtocolOverride(arg: string, next: string) {
   if (!isConfigSwitch(arg)) {
      return;
   }

   if (!/^\s*protocol(.[a-z]+)?.allow/.test(next)) {
      return;
   }

   throw new GitPluginError(
      undefined,
      'unsafe',
      'Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol'
   );
}

export function blockUnsafeOperationsPlugin({
   allowUnsafeProtocolOverride = false,
}: SimpleGitPluginConfig['unsafe'] = {}): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args, _context) {
         args.forEach((current, index) => {
            const next = index < args.length ? args[index + 1] : '';

            allowUnsafeProtocolOverride || preventProtocolOverride(current, next);
         });

         return args;
      },
   };
}
