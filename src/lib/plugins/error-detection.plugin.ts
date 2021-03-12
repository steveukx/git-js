import { GitError } from '../errors/git-error';
import { SimpleGitPluginConfig } from '../types';
import { SimpleGitPlugin } from './simple-git-plugin';

export function errorDetectionPlugin({
                                        streams: {stdOut, stdErr}
                                     }: SimpleGitPluginConfig['errors']): SimpleGitPlugin<'task.error'> {
   return {
      type: 'task.error',
      action(data, context) {
         if (data.error) {
            return data;
         }

         const error = [
            ...(stdOut !== false && context.stdOut || []),
            ...(stdErr !== false && context.stdErr || []),
         ];

         return {
            error: new GitError(undefined, Buffer.concat(error).toString('utf-8')),
         };
      },
   }
}
