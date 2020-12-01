import { PullResult } from '../../../typings';
import { parsePullResult } from '../parsers/parse-pull';
import { Maybe, StringTask } from '../types';

export function pullTask(remote: Maybe<string>, branch: Maybe<string>, customArgs: string[]): StringTask<PullResult> {
   const commands: string[] = ['pull', ...customArgs];
   if (remote && branch) {
      commands.splice(1, 0, remote, branch);
   }

   return {
      commands,
      format: 'utf-8',
      parser(stdOut, stdErr): PullResult {
         return parsePullResult(stdOut, stdErr);
      }
   }
}
