import { GitResponseError } from '../errors/git-response-error';
import { parseMergeResult } from '../parsers/parse-merge';
import type { MergeResult } from '../responses/MergeSummary';
import type { StringTask } from '../types';
import { filterString, getTrailingOptions } from '../utils';
import { configurationErrorTask, type EmptyTask } from './task';

export function mergeTask(customArgs: string[]): EmptyTask | StringTask<MergeResult> {
   if (!customArgs.length) {
      return configurationErrorTask('Git.merge requires at least one option');
   }

   return {
      commands: ['merge', ...customArgs],
      format: 'utf-8',
      parser(stdOut, stdErr): MergeResult {
         const merge = parseMergeResult(stdOut, stdErr);
         if (merge.failed) {
            throw new GitResponseError(merge);
         }

         return merge;
      },
   };
}

export function merge(...args: unknown[]): EmptyTask | StringTask<MergeResult> {
   return mergeTask(getTrailingOptions(args));
}

export function mergeFromTo(
   remote: string,
   branch: string,
   ...args: unknown[]
): EmptyTask | StringTask<MergeResult> {
   if (!(filterString(remote) && filterString(branch))) {
      return configurationErrorTask(
         `Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings`
      );
   }

   return mergeTask([remote, branch, ...getTrailingOptions([remote, branch, ...args])]);
}
