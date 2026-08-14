import { asArray } from '../utils';
import { type StringTask, straightThroughStringTask } from './task';

export function add(files: string | string[]): StringTask<string> {
   return straightThroughStringTask(['add', ...asArray(files)]);
}
