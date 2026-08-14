import { getTrailingOptions } from '../utils';
import { type StringTask, straightThroughStringTask } from './task';

export function rebase(...args: unknown[]): StringTask<string> {
   return straightThroughStringTask(['rebase', ...getTrailingOptions(args)]);
}
