import type { ChildProcess, SpawnOptions } from 'node:child_process';

import type { GitExecutorResult, Maybe } from '../types';
import type {
   GitBinary,
   KillTask,
   PipelineStep,
   SpawnDetail,
   SpawnedControls,
   TaskContext,
   TeardownStep,
} from './types';

export class TaskPipeline {
   constructor(private readonly steps: readonly PipelineStep[]) {}

   stepNames(): string[] {
      return this.steps.map((step) => step.name);
   }

   binary(initial: GitBinary, context: TaskContext): GitBinary {
      return this.steps.reduce(
         (current, step) => (step.binary ? step.binary(current, context) : current),
         initial
      );
   }

   args(initial: string[], context: TaskContext): string[] {
      return this.steps.reduce(
         (current, step) => (step.args ? step.args(current, context) : current),
         initial
      );
   }

   spawnOptions(initial: SpawnOptions, context: TaskContext): SpawnOptions {
      return this.steps.reduce(
         (current, step) => (step.spawnOptions ? step.spawnOptions(current, context) : current),
         initial
      );
   }

   beforeSpawn(detail: SpawnDetail, context: TaskContext, kill: KillTask): void {
      for (const step of this.steps) {
         step.beforeSpawn?.(detail, context, kill);
      }
   }

   onSpawned(
      child: ChildProcess,
      context: TaskContext & { command: string },
      controls: SpawnedControls
   ): TeardownStep[] {
      const teardowns: TeardownStep[] = [];
      for (const step of this.steps) {
         const teardown = step.onSpawned?.(child, context, controls);
         if (typeof teardown === 'function') {
            teardowns.push(teardown);
         }
      }
      return teardowns;
   }

   onError(error: Maybe<Error>, result: GitExecutorResult, context: TaskContext): Maybe<Error> {
      return this.steps.reduce(
         (current, step) => (step.onError ? step.onError(current, result, context) : current),
         error
      );
   }
}
