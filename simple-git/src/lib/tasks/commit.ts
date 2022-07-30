import type { CommitResult, SimpleGit } from '../../../typings';
import type { SimpleGitApi } from '../simple-git-api';
import type { StringTask } from '../types';
import { parseCommitResult } from '../parsers/parse-commit';
import {
   asArray,
   filterArray,
   filterStringOrStringArray,
   filterType,
   getTrailingOptions,
   prefixedArray,
   trailingFunctionArgument,
} from '../utils';
import { configurationErrorTask } from './task';

export function commitTask(
   message: string[],
   files: string[],
   customArgs: string[]
): StringTask<CommitResult> {
   const commands: string[] = [
      '-c',
      'core.abbrev=40',
      'commit',
      ...prefixedArray(message, '-m'),
      ...files,
      ...customArgs,
   ];

   return {
      commands,
      format: 'utf-8',
      parser: parseCommitResult,
   };
}

export default function (): Pick<SimpleGit, 'commit'> {
   return {
      commit(this: SimpleGitApi, message: string | string[], ...rest: unknown[]) {
         const next = trailingFunctionArgument(arguments);
         const task =
            rejectDeprecatedSignatures(message) ||
            commitTask(
               asArray(message),
               asArray(filterType(rest[0], filterStringOrStringArray, [])),
               [...filterType(rest[1], filterArray, []), ...getTrailingOptions(arguments, 0, true)]
            );

         return this._runTask(task, next);
      },
   };

   function rejectDeprecatedSignatures(message?: unknown) {
      return (
         !filterStringOrStringArray(message) &&
         configurationErrorTask(
            `git.commit: requires the commit message to be supplied as a string/string[]`
         )
      );
   }
}
