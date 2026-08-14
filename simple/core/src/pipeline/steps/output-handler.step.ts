import type { SimpleGitPluginConfig } from '../../types';
import type { PipelineStep } from '../types';

export function outputHandlerStep(
   outputHandler: SimpleGitPluginConfig['outputHandler']
): PipelineStep {
   return {
      name: 'outputHandler',
      onSpawned(spawned, context) {
         return outputHandler?.(context.command, spawned.stdout!, spawned.stderr!, [
            ...context.commands,
         ]);
      },
   };
}
