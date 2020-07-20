import { MergeResult } from '../../../typings';
import { GitResponseError } from '../api';
import { parseMergeResult } from '../parsers/parse-merge-result';
import { configurationErrorTask, EmptyTask, StringTask } from './task';

export function mergeTask (customArgs: string[]): EmptyTask | StringTask<MergeResult> {
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
      }
   }
}
