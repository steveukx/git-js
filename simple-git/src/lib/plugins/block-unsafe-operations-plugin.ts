import { vulnerabilityCheck } from '@simple-git/argv-parser';

import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../types';
import type { SimpleGitPlugin } from './simple-git-plugin';

export function blockUnsafeOperationsPlugin(
   options: SimpleGitPluginConfig['unsafe'] = {}
): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args, { env }) {
         for (const vulnerability of vulnerabilityCheck(args, env)) {
            if (options[vulnerability.category] !== true) {
               throw new GitPluginError(undefined, 'unsafe', vulnerability.message);
            }
         }

         return args;
      },
   };
}
