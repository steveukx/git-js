import type { TagResult } from '../responses/TagList';
import { parseTagList } from '../responses/TagList';
import type { StringTask } from '../types';
import { getTrailingOptions } from '../utils';
import { configurationErrorTask, type EmptyTask, straightThroughStringTask } from './task';

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

export function tag(...args: unknown[]): StringTask<string> {
   const command = getTrailingOptions(args);

   if (command[0] !== 'tag') {
      command.unshift('tag');
   }

   return straightThroughStringTask(command);
}

export function tags(...args: unknown[]): StringTask<TagResult> {
   return tagListTask(getTrailingOptions(args));
}

export function addTag(name: string): StringTask<{ name: string }> | EmptyTask {
   return typeof name === 'string'
      ? addTagTask(name)
      : configurationErrorTask('Git.addTag requires a tag name');
}

export function addAnnotatedTag(tagName: string, tagMessage: string): StringTask<{ name: string }> {
   return addAnnotatedTagTask(tagName, tagMessage);
}
