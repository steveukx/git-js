import type { SimpleGitPlugin } from './simple-git-plugin';

import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../types';
import { parseArgv } from '@simple-git/argv-parser';

export function blockUnsafeOperationsPlugin(
   options: SimpleGitPluginConfig['unsafe'] = {}
): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args) {
         const parsed = parseArgv(...args);

         for (const vulnerability of parsed.vulnerabilities.vulnerabilities) {
            if (options[vulnerability.category] !== true) {
               throw new GitPluginError(undefined, 'unsafe', vulnerability.message);
            }
         }

         return args;
      },
   };
}
