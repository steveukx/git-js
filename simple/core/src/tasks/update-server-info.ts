import { type StringTask, straightThroughStringTask } from './task';

export function updateServerInfo(): StringTask<string> {
   return straightThroughStringTask(['update-server-info']);
}
