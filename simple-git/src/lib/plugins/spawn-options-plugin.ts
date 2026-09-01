import type { SpawnOptions } from 'child_process';

import { pick } from '../utils';
import type { SimpleGitPlugin } from './simple-git-plugin';

export function spawnOptionsPlugin(
   spawnOptions: Partial<SpawnOptions>
): SimpleGitPlugin<'spawn.options'> {
   const options = pick(spawnOptions, ['uid', 'gid']);

   return {
      type: 'spawn.options',
      action(data) {
         return { ...options, ...data };
      },
   };
}
