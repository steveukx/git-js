import { GitResponseError } from '../errors/git-response-error';
import { parsePullErrorResult, parsePullResult } from '../parsers/parse-pull';
import type { PullResult } from '../responses/PullSummary';
import type { Maybe, StringTask } from '../types';
import { bufferToString, filterString, filterType, getTrailingOptions } from '../utils';

export function pullTask(
   remote: Maybe<string>,
   branch: Maybe<string>,
   customArgs: string[]
): StringTask<PullResult> {
   const commands: string[] = ['pull', ...customArgs];
   if (remote && branch) {
      commands.splice(1, 0, remote, branch);
   }

   return {
      commands,
      format: 'utf-8',
      parser(stdOut, stdErr): PullResult {
         return parsePullResult(stdOut, stdErr);
      },
      onError(result, _error, _done, fail) {
         const pullError = parsePullErrorResult(
            bufferToString(result.stdOut),
            bufferToString(result.stdErr)
         );
         if (pullError) {
            return fail(new GitResponseError(pullError));
         }

         fail(_error);
      },
   };
}

export function pull(...args: unknown[]): StringTask<PullResult> {
   return pullTask(
      filterType(args[0], filterString),
      filterType(args[1], filterString),
      getTrailingOptions(args)
   );
}
