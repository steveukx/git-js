import { GitError } from '../errors/git-error';
import { GitExecutorResult, SimpleGitPluginConfig } from '../types';
import { SimpleGitPlugin } from './simple-git-plugin';

type TaskResult = Omit<GitExecutorResult, 'rejection'>;

function isTaskError(result: TaskResult) {
   return !!(result.exitCode && result.stdErr.length);
}

function getErrorMessage(result: TaskResult) {
   return Buffer.concat([...result.stdOut, ...result.stdErr]);
}

export function errorDetectionHandler(
   overwrite = false,
   isError = isTaskError,
   errorMessage: (result: TaskResult) => Buffer | Error = getErrorMessage
) {
   return (error: Buffer | Error | undefined, result: TaskResult) => {
      if ((!overwrite && error) || !isError(result)) {
         return error;
      }

      return errorMessage(result);
   };
}

export function errorDetectionPlugin(
   config: SimpleGitPluginConfig['errors']
): SimpleGitPlugin<'task.error'> {
   return {
      type: 'task.error',
      action(data, context) {
         const error = config(data.error, {
            stdErr: context.stdErr,
            stdOut: context.stdOut,
            exitCode: context.exitCode,
         });

         if (Buffer.isBuffer(error)) {
            return { error: new GitError(undefined, error.toString('utf-8')) };
         }

         return {
            error,
         };
      },
   };
}
