import type { StringTask } from '../types';
import { straightThroughStringTask } from './task';

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

export function hashObject(path: string, write?: boolean | unknown): StringTask<string> {
   return hashObjectTask(path, write === true);
}
