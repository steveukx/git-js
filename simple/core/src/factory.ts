import { configWriteGuardStep } from './guards/config-write-guard.step';
import { envFilterStep } from './guards/env-filter.step';
import { TaskPipeline } from './pipeline/pipeline';
import { abortStep } from './pipeline/steps/abort.step';
import { blockUnsafeOperationsStep } from './pipeline/steps/block-unsafe-operations.step';
import { commandConfigPrefixingStep } from './pipeline/steps/command-config-prefixing.step';
import { completionDetectionStep } from './pipeline/steps/completion-detection.step';
import { errorDetectionHandler, errorDetectionStep } from './pipeline/steps/error-detection.step';
import { outputHandlerStep } from './pipeline/steps/output-handler.step';
import { progressMonitorStep } from './pipeline/steps/progress-monitor.step';
import { spawnOptionsStep } from './pipeline/steps/spawn-options.step';
import { suffixPathsStep } from './pipeline/steps/suffix-paths.step';
import { timeoutStep } from './pipeline/steps/timeout.step';
import type { PipelineStep } from './pipeline/types';
import type { SimpleGitCoreOptions } from './types';
import { append, notEmpty } from './utils';

/**
 * Assembles the pipeline of steps run around every spawned task, mirroring
 * v3's plugin registration order. This list is the single source of truth for
 * stage ordering - within each lifecycle stage, steps run in the order they
 * appear here. The custom binary is not a step: it is validated up front and
 * held as executor state, applied by the executor chain after the `args`
 * stage completes (the equivalent of running last, as v3's custom-binary
 * plugin did).
 */
export function createTaskPipeline(options: SimpleGitCoreOptions): TaskPipeline {
   const steps: Array<PipelineStep | undefined | void> = [];

   if (Array.isArray(options.config) && options.config.length) {
      append(steps, commandConfigPrefixingStep(options.config));
   }

   steps.push(blockUnsafeOperationsStep(options.unsafe));
   steps.push(completionDetectionStep(options.completion));
   steps.push(options.abort && abortStep(options.abort));
   steps.push(options.progress && progressMonitorStep(options.progress));
   steps.push(options.timeout && timeoutStep(options.timeout));
   steps.push(options.spawnOptions && spawnOptionsStep(options.spawnOptions));
   steps.push(envFilterStep(options.allowEnvironment));
   steps.push(suffixPathsStep());
   steps.push(errorDetectionStep(errorDetectionHandler(true)));
   steps.push(options.errors && errorDetectionStep(options.errors, 'errorDetectionUser'));
   steps.push(options.outputHandler && outputHandlerStep(options.outputHandler));

   // registered last so its `beforeSpawn` assertion of the ordering (config
   // prefixing before the guard) is visible in `stepNames()` - the guard
   // itself reads the final argv, so no args-stage registration can bypass it
   append(steps, configWriteGuardStep(options.allowConfigWrite));

   return new TaskPipeline(notEmpty(steps));
}
