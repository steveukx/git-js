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

function preventUploadPack(arg: string, method: string) {
   if (/^\s*--(upload|receive)-pack/.test(arg)) {
      throw new GitPluginError(
         undefined,
         'unsafe',
         `Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack`
      );
   }

   if (method === 'clone' && /^\s*-u\b/.test(arg)) {
      throw new GitPluginError(
         undefined,
         'unsafe',
         `Use of clone with option -u is not permitted without enabling allowUnsafePack`
      );
   }

   if (method === 'push' && /^\s*--exec\b/.test(arg)) {
      throw new GitPluginError(
         undefined,
         'unsafe',
         `Use of push with option --exec is not permitted without enabling allowUnsafePack`
      );
   }
}

export function blockUnsafeOperationsPlugin({
   allowUnsafeProtocolOverride = false,
   allowUnsafePack = false,
}: SimpleGitPluginConfig['unsafe'] = {}): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args, context) {
         args.forEach((current, index) => {
            const next = index < args.length ? args[index + 1] : '';

            allowUnsafeProtocolOverride || preventProtocolOverride(current, next);
            allowUnsafePack || preventUploadPack(current, context.method);
         });

         return args;
      },
   };
}
