import type { SimpleGitPluginConfig } from '../../types';
import { asNumber, including } from '../../utils';
import type { PipelineStep } from '../types';

export function progressMonitorStep(progress: SimpleGitPluginConfig['progress']): PipelineStep {
   const progressCommand = '--progress';
   const progressMethods = ['checkout', 'clone', 'fetch', 'pull', 'push'];

   return {
      name: 'progressMonitor',
      args(args, context) {
         if (!progressMethods.includes(context.method)) {
            return args;
         }

         return including(args, progressCommand);
      },
      onSpawned(spawned, context) {
         if (!context.commands.includes(progressCommand)) {
            return;
         }

         spawned.stderr?.on('data', (chunk: Buffer) => {
            const message = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(chunk.toString('utf8'));
            if (!message) {
               return;
            }

            progress({
               method: context.method,
               stage: progressEventStage(message[1]),
               progress: asNumber(message[2]),
               processed: asNumber(message[3]),
               total: asNumber(message[4]),
            });
         });
      },
   };
}

function progressEventStage(input: string) {
   return String(input.toLowerCase().split(' ', 1)) || 'unknown';
}
