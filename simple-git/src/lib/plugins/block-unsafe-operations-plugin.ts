import type { SimpleGitPlugin } from './simple-git-plugin';

import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../types';

function isConfigSwitch(arg: string | unknown) {
   return typeof arg === 'string' && arg.trim().toLowerCase() === '-c';
}

function isCloneSwitch(char: string, arg: string | unknown) {
   if (typeof arg !== 'string' || !arg.includes(char)) {
      return false;
   }

   const token = arg.replace(/\0g/, '').replace(/^(--no)?-{1,2}/, '');
   return /^[\dlsqvnobucj]+\b/.test(token);
}

function preventConfigBuilder(
   config: string | RegExp,
   setting: keyof SimpleGitPluginConfig['unsafe'],
   message = String(config)
) {
   const regex = typeof config === 'string' ? new RegExp(`\\s*${config}`, 'i') : config;

   return function preventCommand(
      options: Partial<SimpleGitPluginConfig['unsafe']>,
      arg: string,
      next: string
   ) {
      if (options[setting] !== true && isConfigSwitch(arg) && regex.test(next)) {
         throw new GitPluginError(
            undefined,
            'unsafe',
            `Configuring ${message} is not permitted without enabling ${setting}`
         );
      }
   };
}

const preventUnsafeConfig = [
   preventConfigBuilder(
      /^\s*protocol(.[a-z]+)?.allow/i,
      'allowUnsafeProtocolOverride',
      'protocol.allow'
   ),
   preventConfigBuilder('core.sshCommand', 'allowUnsafeSshCommand'),
   preventConfigBuilder('core.gitProxy', 'allowUnsafeGitProxy'),
   preventConfigBuilder('core.hooksPath', 'allowUnsafeHooksPath'),
   preventConfigBuilder('diff.external', 'allowUnsafeDiffExternal'),
];

function preventUploadPack(arg: string, method: string) {
   if (/^\s*--(upload|receive)-pack/.test(arg)) {
      throw new GitPluginError(
         undefined,
         'unsafe',
         `Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack`
      );
   }

   if (method === 'clone' && isCloneSwitch('u', arg)) {
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
   allowUnsafePack = false,
   ...options
}: SimpleGitPluginConfig['unsafe'] = {}): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args, context) {
         args.forEach((current, index) => {
            const next = index < args.length ? args[index + 1] : '';

            allowUnsafePack || preventUploadPack(current, context.method);
            preventUnsafeConfig.forEach((helper) => helper(options, current, next));
         });

         return args;
      },
   };
}
