import { SimpleGitOptions } from '../types';

import { SimpleGitPlugin } from './simple-git-plugin';
import { GitPluginError } from '../errors/git-plugin-error';

export function timeoutPlugin({block}: Exclude<SimpleGitOptions['timeout'], undefined>): SimpleGitPlugin<'spawn.after'> | void {

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
            }

            function kill() {
               stop()
               context.kill(
                  new GitPluginError(undefined, 'timeout', `block timeout reached`)
               );
            }

            context.spawned.stdout?.on('data', wait);
            context.spawned.stderr?.on('data', wait);
            context.spawned.on('exit', stop);
            context.spawned.on('close', stop);

            wait();
         }
      }
   }

}
