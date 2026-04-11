import type { SimpleGitPlugin } from './simple-git-plugin';

import { GitPluginError } from '../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../types';
import { parseArgv, parseEnv, Vulnerability } from '@simple-git/argv-parser';

export function blockUnsafeOperationsPlugin(
   options: SimpleGitPluginConfig['unsafe'] = {}
): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(args, { env }) {
         for (const vulnerability of collectVulnerabilities(args, env)) {
            if (options[vulnerability.category] !== true) {
               throw new GitPluginError(undefined, 'unsafe', vulnerability.message);
            }
         }

         return args;
      },
   };
}

function collectVulnerabilities(args: string[], env: Record<string, unknown>): Vulnerability[] {
   return [...parseArgv(...args).vulnerabilities, ...parseEnv(env).vulnerabilities];
}
