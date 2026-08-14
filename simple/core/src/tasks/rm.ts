import { asArray } from '../utils';
import { type StringTask, straightThroughStringTask } from './task';

/**
 * Removes the named files from source control and deletes them from disk.
 */
export function rm(files: string | string[]): StringTask<string> {
   return straightThroughStringTask(['rm', '-f', ...asArray(files)]);
}

/**
 * Removes the named files from source control but keeps them on disk rather
 * than deleting them entirely. To completely remove the files, use `rm`.
 */
export function rmKeepLocal(files: string | string[]): StringTask<string> {
   return straightThroughStringTask(['rm', '--cached', ...asArray(files)]);
}
