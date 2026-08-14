import { GitPluginError } from '../../errors/git-plugin-error';
import type { SimpleGitPluginConfig } from '../../types';
import type { PipelineStep } from '../types';

export function timeoutStep({
   block,
   stdErr = true,
   stdOut = true,
}: SimpleGitPluginConfig['timeout']): PipelineStep | void {
   if (block > 0) {
      return {
         name: 'timeout',
         onSpawned(spawned, _context, controls) {
            let timeout: NodeJS.Timeout;

            function wait() {
               timeout && clearTimeout(timeout);
               timeout = setTimeout(kill, block);
            }

            function stop() {
               spawned.stdout?.off('data', wait);
               spawned.stderr?.off('data', wait);
               spawned.off('exit', stop);
               spawned.off('close', stop);
               timeout && clearTimeout(timeout);
            }

            function kill() {
               stop();
               controls.kill(new GitPluginError(undefined, 'timeout', `block timeout reached`));
            }

            stdOut && spawned.stdout?.on('data', wait);
            stdErr && spawned.stderr?.on('data', wait);
            spawned.on('exit', stop);
            spawned.on('close', stop);

            wait();
         },
      };
   }
}
