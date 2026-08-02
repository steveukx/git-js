import { GitPluginError } from './errors/git-plugin-error';
import type { GitBinary } from './pipeline/types';
import type { SimpleGitCoreOptions } from './types';
import { asArray } from './utils';

const WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
const WRONG_CHARS_ERR = `Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option`;

function isBadArgument(arg: string) {
   return !arg || !/^([a-z]:)?([a-z0-9/.\\_~-]+)$/i.test(arg);
}

/**
 * Validates the configured binary (from the `binary` constructor option or a
 * `customBinary()` call) and normalises it to the `GitBinary` the executor
 * spawns with. Unsafe values throw a `GitPluginError` unless the
 * `unsafe.allowUnsafeCustomBinary` option downgrades the error to a warning -
 * the same behaviour as v3's custom-binary plugin, applied at configuration
 * time rather than per spawn.
 */
export function createBinaryConfig(
   input: SimpleGitCoreOptions['binary'] = ['git'],
   allowUnsafe = false
): GitBinary {
   const config = asArray(input);

   if (config.length < 1 || config.length > 2) {
      throw new GitPluginError(undefined, 'binary', WRONG_NUMBER_ERR);
   }

   const isBad = config.some(isBadArgument);
   if (isBad) {
      if (allowUnsafe) {
         console.warn(WRONG_CHARS_ERR);
      } else {
         throw new GitPluginError(undefined, 'binary', WRONG_CHARS_ERR);
      }
   }

   const [binary, prefix] = config;
   return {
      binary,
      prefix: prefix ? [prefix] : [],
   };
}
