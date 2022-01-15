import { CommitResult } from '../../../typings';
import { parseCommitResult } from '../parsers/parse-commit';
import { StringTask } from '../types';

export function commitTask(message: string[], files: string[], customArgs: string[]): StringTask<CommitResult> {
   const commands: string[] = ['commit'];

   message.forEach((m) => commands.push('-m', m));

   commands.push(
      ...files,
      ...customArgs,
   );

   return {
      commands,
      format: 'utf-8',
      parser: parseCommitResult,
   }
}
