import { GitPluginError } from '../errors/git-plugin-error';
import { createLogger } from '../git-logger';
import type { SimpleGitOptions } from '../types';
import { asArray } from '../utils';
import type { PluginStore } from './plugin-store';

const logger = createLogger('', 'plugin:binary');

const WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
const WRONG_CHARS_ERR = `Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option`;

const SAFE_CHARS = /^([a-z]:)?([a-z0-9/.\\_~-]+)$/i;
const SAFE_CHARS_WITH_SPACES = /^([a-z]:)?([a-z0-9/.\\_~ -]+)$/i;

/**
 * Spaces are only permitted in the binary when it looks like a real path to a file: there must be
 * at least one path separator, and no path segment may start or end with a space (which rules out
 * values such as `git status` or `git /path` that would only look like a command and its arguments).
 */
function isPathWithSpaces(arg: string) {
   if (!SAFE_CHARS_WITH_SPACES.test(arg) || !/[\\/]/.test(arg)) {
      return false;
   }

   return arg.split(/[\\/]/).every((segment) => segment === segment.trim());
}

/**
 * The binary (`argIndex=0`) may additionally contain spaces when it looks like a path, eg:
 * `C:\Program Files\Git\bin\git.exe`. The prefix (`argIndex=1`) is passed to the binary as its
 * first argument, so remains restricted to the strict character set to prevent it being used to
 * supply options such as `--exec-path=...`.
 */
function isBadArgument(arg: string, argIndex: number) {
   if (!arg) {
      return true;
   }

   if (SAFE_CHARS.test(arg)) {
      return false;
   }

   return argIndex !== 0 || !isPathWithSpaces(arg);
}

function toBinaryConfig(
   input: string[],
   allowUnsafe: boolean
): { binary: string; prefix?: string } {
   if (input.length < 1 || input.length > 2) {
      throw new GitPluginError(undefined, 'binary', WRONG_NUMBER_ERR);
   }

   const isBad = input.some((arg, argIndex) => isBadArgument(arg, argIndex));
   if (isBad) {
      if (allowUnsafe) {
         logger('permitted unsafe binary %o', input);
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
      logger.info('reconfiguring %o', config);
   });

   plugins.append('spawn.binary', () => {
      return config.binary;
   });

   plugins.append('spawn.args', (data) => {
      return config.prefix ? [config.prefix, ...data] : data;
   });
}
