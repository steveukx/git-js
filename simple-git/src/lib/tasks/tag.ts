import { TagResult } from '../../../typings';
import { parseTagList } from '../responses/TagList';
import { StringTask } from '../types';

/**
 * Task used by `git.tags`
 */
export function tagListTask(customArgs: string[] = []): StringTask<TagResult> {
   const hasCustomSort = customArgs.some((option) => /^--sort=/.test(option));

   return {
      format: 'utf-8',
      commands: ['tag', '-l', ...customArgs],
      parser(text: string) {
         return parseTagList(text, hasCustomSort);
      },
   };
}

/**
 * Task used by `git.addTag`
 */
export function addTagTask(name: string): StringTask<{ name: string }> {
   return {
      format: 'utf-8',
      commands: ['tag', name],
      parser() {
         return { name };
      },
   };
}

/**
 * Task used by `git.addTag`
 */
export function addAnnotatedTagTask(
   name: string,
   tagMessage: string
): StringTask<{ name: string }> {
   return {
      format: 'utf-8',
      commands: ['tag', '-a', '-m', tagMessage, name],
      parser() {
         return { name };
      },
   };
}
