import { StringTask, straightThroughStringTask } from './task';

/**
 * Task used by `git.hashObject`
 */
export function hashObjectTask (filePath: string): StringTask<string> {
   const commands = ['hash-object', filePath];

   return straightThroughStringTask(commands, true);
}
