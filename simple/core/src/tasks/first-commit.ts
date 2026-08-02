import { type StringTask, straightThroughStringTask } from './task';

export function firstCommit(): StringTask<string> {
   return straightThroughStringTask(['rev-list', '--max-parents=0', 'HEAD'], true);
}
