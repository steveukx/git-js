import { blessConfig } from '../config/bless-config';
import type { VariadicOptions } from '../options/options.types';
import { asTaskOptions } from '../options/task-options';
import { asArray } from '../parsing/parse.helpers';
import { type CommitResult, parseCommitResult } from '../parsing/parse-commit';
import type { StringTask } from '../task/task.types';

export type { CommitResult };

/**
 * Records a commit. Runs with a blessed `-c core.abbrev=40` so the resulting
 * hash is reported in full — the write is internal to simple-git and exempt from
 * the config-write guard via {@link blessConfig}, without opening the allow-list.
 */
export function commit(
   message: string | string[],
   files: string | string[] = [],
   ...options: VariadicOptions
): StringTask<CommitResult> {
   const messages = asArray(message).flatMap((entry) => ['-m', entry]);

   return {
      format: 'utf-8',
      commands: [
         '-c',
         blessConfig('core.abbrev', '40'),
         'commit',
         ...messages,
         ...asArray(files),
         ...asTaskOptions(options),
      ],
      parser: parseCommitResult,
   };
}
