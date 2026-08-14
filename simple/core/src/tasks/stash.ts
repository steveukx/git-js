import { getTrailingOptions } from '../utils';
import { type StringTask, straightThroughStringTask } from './task';

export function stash(...args: unknown[]): StringTask<string> {
   return straightThroughStringTask(['stash', ...getTrailingOptions(args)]);
}
