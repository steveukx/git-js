import { PullResult } from '../../../typings';
import { GitResponseError } from '../errors/git-response-error';
import { parsePullErrorResult, parsePullResult } from '../parsers/parse-pull';
import { Maybe, StringTask } from '../types';
import { bufferToString } from '../utils';

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
