import { getTrailingOptions } from '../utils';
import {
   type BufferTask,
   type StringTask,
   straightThroughBufferTask,
   straightThroughStringTask,
} from './task';

export function show(...args: unknown[]): StringTask<string> {
   return straightThroughStringTask(['show', ...getTrailingOptions(args, 1)]);
}

export function showBuffer(...args: unknown[]): BufferTask<Buffer> {
   const commands = ['show', ...getTrailingOptions(args, 1)];
   if (!commands.includes('--binary')) {
      commands.splice(1, 0, '--binary');
   }

   return straightThroughBufferTask(commands);
}
