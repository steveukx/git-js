import { StringTask } from './task';
import { TagResult } from '../../../typings/response';
import { parseTagList } from '../responses/TagList';

/**
 * Task used by `git.tags`
 */
export function tagListTask (customArgs: string[] = []): StringTask<TagResult> {
   const hasCustomSort = customArgs.some((option) => /^--sort=/.test(option));

   return {
      format: 'utf-8',
      commands: ['tag', '-l', ...customArgs],
      parser (text: string) {
         return parseTagList(text, hasCustomSort);
      },
   }
}
