import { straightThroughStringTask } from './task';
import { StringTask } from '../types';

/**
 * Task used by `git.hashObject`
 */
export function hashObjectTask(filePath: string, write: boolean): StringTask<string> {
   const commands = ['hash-object', filePath];
   if (write) {
      commands.push('-w');
   }

   return straightThroughStringTask(commands, true);
}
