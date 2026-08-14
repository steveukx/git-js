import { trustedConfig } from '../guards/trusted-config';
import { parseCommitResult } from '../parsers/parse-commit';
import {
   asArray,
   asStringArray,
   filterArray,
   filterStringOrStringArray,
   filterType,
   getTrailingOptions,
   prefixedArray,
} from '../utils';
import { configurationErrorTask, type EmptyTask, type StringTask } from './task';

export interface CommitResult {
   author: null | {
      email: string;
      name: string;
   };
   branch: string;
   commit: string;
   root: boolean;
   summary: {
      changes: number;
      insertions: number;
      deletions: number;
   };
}

export function commitTask(
   message: string[],
   files: string[],
   customArgs: string[]
): StringTask<CommitResult> {
   // the library-authored `core.abbrev` injection (full-length commit hash in
   // the parsed response) is branded trusted so it passes the config guard
   const commands: string[] = [
      '-c',
      trustedConfig('core.abbrev=40'),
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

export function commit(
   message: string | string[],
   ...rest: unknown[]
): StringTask<CommitResult> | EmptyTask {
   return (
      rejectDeprecatedSignatures(message) ||
      commitTask(asArray(message), asArray(filterType(rest[0], filterStringOrStringArray, [])), [
         ...asStringArray(filterType(rest[1], filterArray, [])),
         ...getTrailingOptions([message, ...rest], 0, true),
      ])
   );

   function rejectDeprecatedSignatures(message?: unknown) {
      return (
         !filterStringOrStringArray(message) &&
         configurationErrorTask(
            `git.commit: requires the commit message to be supplied as a string/string[]`
         )
      );
   }
}
