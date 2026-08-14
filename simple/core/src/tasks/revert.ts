import { getTrailingOptions } from '../utils';
import {
   configurationErrorTask,
   type EmptyTask,
   type StringTask,
   straightThroughStringTask,
} from './task';

export function revert(commit: string, ...args: unknown[]): StringTask<string> | EmptyTask {
   if (typeof commit !== 'string') {
      return configurationErrorTask('Commit must be a string');
   }

   return straightThroughStringTask([
      'revert',
      ...getTrailingOptions([commit, ...args], 0, true),
      commit,
   ]);
}
