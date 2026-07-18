import type { SpawnOptions } from 'node:child_process';

import { pick } from '../../utils';
import type { PipelineStep } from '../types';

export function spawnOptionsStep(spawnOptions: Partial<SpawnOptions>): PipelineStep {
   const options = pick(spawnOptions, ['uid', 'gid']);

   return {
      name: 'spawnOptions',
      spawnOptions(current) {
         return { ...options, ...current };
      },
   };
}
