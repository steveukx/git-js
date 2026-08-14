import { getTrailingOptions } from '../utils';
import { type StringTask, straightThroughStringTask } from './task';

export function revparse(...args: unknown[]): StringTask<string> {
   return straightThroughStringTask(['rev-parse', ...getTrailingOptions(args, 1)], true);
}
