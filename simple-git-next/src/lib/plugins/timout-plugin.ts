import type { SimpleGitPlugin } from './simple-git-plugin';

import type { SimpleGitOptions } from '../types';
import { GitPluginError } from '../errors/git-plugin-error';

export function timeoutPlugin({
   block,
   stdErr = true,
   stdOut = true,
}: Exclude<SimpleGitOptions['timeout'], undefined>): SimpleGitPlugin<'spawn.after'> | void {
   if (block > 0) {
      return {
         type: 'spawn.after',
         action(_data, context) {
            let timeout: NodeJS.Timeout;

            function wait() {
               timeout && clearTimeout(timeout);
               timeout = setTimeout(kill, block);
            }

            function stop() {
               context.spawned.stdout?.off('data', wait);
               context.spawned.stderr?.off('data', wait);
               context.spawned.off('exit', stop);
               context.spawned.off('close', stop);
               timeout && clearTimeout(timeout);
            }

            function kill() {
               stop();
               context.kill(new GitPluginError(undefined, 'timeout', `block timeout reached`));
            }

            stdOut && context.spawned.stdout?.on('data', wait);
            stdErr && context.spawned.stderr?.on('data', wait);
            context.spawned.on('exit', stop);
            context.spawned.on('close', stop);

            wait();
         },
      };
   }
}
