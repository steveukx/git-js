import { MergeResult } from '../../../typings';
import { GitResponseError } from '../api';
import { parseMerge } from '../responses/MergeSummary';
import { configurationErrorTask, EmptyTask, StringTask } from './task';

export function mergeTask (customArgs: string[]): EmptyTask | StringTask<MergeResult> {
   if (!customArgs.length) {
      return configurationErrorTask('Git.merge requires at least one option');
   }

   return {
      commands: ['merge', ...customArgs],
      concatStdErr: true,
      format: 'utf-8',
      parser(text: string): MergeResult {
         const merge = parseMerge(text);
         if (merge.failed) {
            throw new GitResponseError(merge);
         }

         return merge;
      }
   }
}
