import type { SimpleGitOptions } from '../types';

import { GitPluginError } from '../errors/git-plugin-error';
import { asArray } from '../utils';
import { PluginStore } from './plugin-store';

function isBadArgument(arg: string) {
   return !arg || !/^([a-z0-9/\_-]+)$/.test(arg);
}

function toBinaryConfig(input: string[]): { binary: string; prefix?: string } {
   if (input.length < 1 || input.length > 2 || input.some(isBadArgument)) {
      throw new GitPluginError(
         undefined,
         'binary',
         `Invalid value supplied for custom binary, requires one or two strings matching alpha-numeric, hyphen or underscore`
      );
   }

   const [binary, prefix] = input;
   return {
      binary,
      prefix,
   };
}

export function customBinaryPlugin(
   plugins: PluginStore,
   input: SimpleGitOptions['binary'] = ['git']
) {
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
