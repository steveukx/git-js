import { SimpleGitOptions } from '../types';
import { SimpleGitPlugin } from './simple-git-plugin';
import { GitPluginError } from '../errors/git-plugin-error';

export function abortPlugin(signal: SimpleGitOptions['abort']) {
   if (!signal) {
      return;
   }

   const onSpawnAfter: SimpleGitPlugin<'spawn.after'> = {
      type: 'spawn.after',
      action(_data, context) {
         function kill() {
            context.kill(new GitPluginError(undefined, 'abort', 'Abort signal received'));
         }

         signal.addEventListener('abort', kill);

         context.spawned.on('close', () => signal.removeEventListener('abort', kill));
      },
   };

   const onSpawnBefore: SimpleGitPlugin<'spawn.before'> = {
      type: 'spawn.before',
      action(_data, context) {
         if (signal.aborted) {
            context.kill(new GitPluginError(undefined, 'abort', 'Abort already signaled'));
         }
      },
   };

   return [onSpawnBefore, onSpawnAfter];
}
