import { SimpleGitOptions } from '../types';
import { asNumber, including } from '../utils';

import { SimpleGitPlugin } from './simple-git-plugin';

export function progressMonitorPlugin(progress: Exclude<SimpleGitOptions['progress'], void>) {
   const progressCommand = '--progress';
   const progressMethods = ['checkout', 'clone', 'pull'];

   const onProgress: SimpleGitPlugin<'spawn.after'> = {
      type: 'spawn.after',
      action(_data, context) {
         if (!context.commands.includes(progressCommand)) {
            return;
         }

         context.spawned.stderr?.on('data', (chunk: Buffer) => {
            const message = /Receiving objects:\s*(\d+)% \((\d+)\/(\d+)\)/.exec(chunk.toString('utf8'));
            if (message) {
               progress({
                  method: context.method,
                  progress: asNumber(message[1]),
                  received: asNumber(message[2]),
                  total: asNumber(message[3]),
               });
            }
         });
      }
   };

   const onArgs: SimpleGitPlugin<'spawn.args'> = {
      type: 'spawn.args',
      action(args, context) {
         if (!progressMethods.includes(context.method)) {
            return args;
         }

         return including(args, progressCommand);
      }
   }

   return [onArgs, onProgress];
}
