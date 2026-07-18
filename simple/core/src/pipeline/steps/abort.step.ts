import { GitPluginError } from '../../errors/git-plugin-error';
import type { PipelineStep } from '../types';

export function abortStep(signal: AbortSignal): PipelineStep {
   return {
      name: 'abort',
      beforeSpawn(_detail, _context, kill) {
         if (signal.aborted) {
            kill(new GitPluginError(undefined, 'abort', 'Abort already signaled'));
         }
      },
      onSpawned(spawned, _context, controls) {
         function kill() {
            controls.kill(new GitPluginError(undefined, 'abort', 'Abort signal received'));
         }

         signal.addEventListener('abort', kill);

         spawned.on('close', () => signal.removeEventListener('abort', kill));
      },
   };
}
