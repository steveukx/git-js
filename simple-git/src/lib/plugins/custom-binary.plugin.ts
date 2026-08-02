import type { SimpleGitOptions } from '../types';

import { GitPluginError } from '../errors/git-plugin-error';
import { asArray } from '../utils';
import { PluginStore } from './plugin-store';

const WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
const EMPTY_ARG_ERR = `Invalid value supplied for custom binary, each element must be a non-empty string`;

function isBadArgument(arg: string) {
   return !arg;
}

function toBinaryConfig(
   input: string[]
): { binary: string; prefix?: string } {
   if (input.length < 1 || input.length > 2) {
      throw new GitPluginError(undefined, 'binary', WRONG_NUMBER_ERR);
   }

   const isBad = input.some(isBadArgument);
   if (isBad) {
      throw new GitPluginError(undefined, 'binary', EMPTY_ARG_ERR);
   }

   const [binary, prefix] = input;
   return {
      binary,
      prefix,
   };
}

export function customBinaryPlugin(
   plugins: PluginStore,
   input: SimpleGitOptions['binary'] = ['git'],
   allowUnsafe = false
) {
   if (allowUnsafe) {
      // Retained for backwards compatibility: `unsafe.allowUnsafeCustomBinary` used
      // to bypass the character allowlist, which no longer exists. The option now
      // has no effect, so warn to nudge users off it.
      console.warn(
         `simple-git: the unsafe.allowUnsafeCustomBinary option is deprecated and no longer has any effect - the custom binary is spawned directly with shell: false, so there is no character allowlist to bypass.`
      );
   }

   let config = toBinaryConfig(asArray(input));

   plugins.on('binary', (input) => {
      config = toBinaryConfig(asArray(input));
   });

   plugins.append('spawn.binary', () => {
      return config.binary;
   });

   plugins.append('spawn.args', (data) => {
      return config.prefix ? [config.prefix, ...data] : data;
   });
}
