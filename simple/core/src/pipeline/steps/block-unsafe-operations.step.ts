import { vulnerabilityCheck } from '@simple-git/argv-parser';

import { GitPluginError } from '../../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../../types';
import type { PipelineStep } from '../types';

export function blockUnsafeOperationsStep(
   options: SimpleGitPluginConfig['unsafe'] = {}
): PipelineStep {
   return {
      name: 'blockUnsafeOperations',
      args(args, context) {
         for (const vulnerability of vulnerabilityCheck(args, context.env)) {
            if (options[vulnerability.category] !== true) {
               throw new GitPluginError(undefined, 'unsafe', vulnerability.message);
            }
         }

         return args;
      },
   };
}
