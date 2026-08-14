import { GitError } from '../../errors/git-error';
import type { GitExecutorResult, SimpleGitPluginConfig } from '../../types';
import type { PipelineStep } from '../types';

type TaskResult = Omit<GitExecutorResult, 'rejection'>;

function isTaskError(result: TaskResult): boolean {
   return !!(result.exitCode && result.stdErr.length);
}

function getErrorMessage(result: TaskResult): Buffer {
   return Buffer.concat([...result.stdOut, ...result.stdErr]);
}

export function errorDetectionHandler(
   overwrite = false,
   isError: (result: TaskResult) => boolean = isTaskError,
   errorMessage: (result: TaskResult) => Buffer | Error = getErrorMessage
): (error: Buffer | Error | undefined, result: TaskResult) => Buffer | Error | undefined {
   return (error: Buffer | Error | undefined, result: TaskResult) => {
      if ((!overwrite && error) || !isError(result)) {
         return error;
      }

      return errorMessage(result);
   };
}

export function errorDetectionStep(
   config: SimpleGitPluginConfig['errors'],
   name = 'errorDetection'
): PipelineStep {
   return {
      name,
      onError(error, result) {
         const outcome = config(error, {
            stdErr: result.stdErr,
            stdOut: result.stdOut,
            exitCode: result.exitCode,
         });

         if (Buffer.isBuffer(outcome)) {
            return new GitError(undefined, outcome.toString('utf-8'));
         }

         return outcome;
      },
   };
}
