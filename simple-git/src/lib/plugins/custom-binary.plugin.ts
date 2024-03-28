import type { SimpleGitOptions } from '../types';

import { GitPluginError } from '../errors/git-plugin-error';
import { asArray } from '../utils';
import { PluginStore } from './plugin-store';

const WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
const WRONG_CHARS_ERR = `Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option`;

function isBadArgument(arg: string) {
   return !arg || !/^([a-z]:)?([a-z0-9/.\\_-]+)$/i.test(arg);
}

function toBinaryConfig(
   input: string[],
   allowUnsafe: boolean
): { binary: string; prefix?: string } {
   if (input.length < 1 || input.length > 2) {
      throw new GitPluginError(undefined, 'binary', WRONG_NUMBER_ERR);
   }

   const isBad = input.some(isBadArgument);
   if (isBad) {
      if (allowUnsafe) {
         console.warn(WRONG_CHARS_ERR);
      } else {
         throw new GitPluginError(undefined, 'binary', WRONG_CHARS_ERR);
      }
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
   let config = toBinaryConfig(asArray(input), allowUnsafe);

   plugins.on('binary', (input) => {
      config = toBinaryConfig(asArray(input), allowUnsafe);
   });

   plugins.append('spawn.binary', () => {
      return config.binary;
   });

   plugins.append('spawn.args', (data) => {
      return config.prefix ? [config.prefix, ...data] : data;
   });
}
