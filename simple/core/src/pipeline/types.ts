import type { ChildProcess, SpawnOptions } from 'node:child_process';

import type { GitExecutorResult, Maybe } from '../types';

/**
 * Read-only detail of the task a pipeline step is being run for.
 */
export interface TaskContext {
   /** The git sub-command being run, eg `commit` / `push` */
   readonly method: string;
   /** The commands the step applies to - the task's original commands or the final argv depending on stage */
   readonly commands: readonly string[];
   /** Environment variables supplied through `.env()` on the executor - not the ambient environment */
   readonly env: NodeJS.ProcessEnv;
}

/**
 * The binary (and optional argv prefix, eg for `wsl git ...`) used to spawn
 * the child process.
 */
export interface GitBinary {
   binary: string;
   prefix: string[];
}

/**
 * The final spawn configuration presented to `beforeSpawn` steps - the argv
 * here includes every transform from the `args` stage plus any binary prefix.
 */
export interface SpawnDetail {
   readonly binary: string;
   readonly args: readonly string[];
   readonly options: SpawnOptions;
}

export interface SpawnedControls {
   /** Resolves the task with the supplied exit code, optionally recording the reason it should reject */
   close(exitCode: number, reason?: Error): void;
   /** Kills the in-flight child process and records the reason the task should reject */
   kill(reason: Error): void;
}

export type KillTask = (reason: Error) => void;

export type TeardownStep = () => void;

/**
 * A step in the task pipeline - the replacement for v3's event-emitter style
 * plugin store. Steps implement any subset of the six lifecycle stages; within
 * every stage the steps run in registration order, which is fixed in one place
 * when the pipeline is assembled.
 *
 * Unlike v3's `spawn.before`, the `beforeSpawn` stage fires exactly once per
 * task and receives the truly final argv and spawn options. A step can prevent
 * the spawn either by calling `kill` (the task resolves through the normal
 * error-detection path with exit code 9901) or by throwing (the task rejects
 * and the executor chain is purged).
 */
export interface PipelineStep {
   /** Unique name used by ordering assertions */
   readonly name: string;

   binary?(current: GitBinary, context: TaskContext): GitBinary;

   args?(args: string[], context: TaskContext): string[];

   spawnOptions?(options: SpawnOptions, context: TaskContext): SpawnOptions;

   beforeSpawn?(detail: SpawnDetail, context: TaskContext, kill: KillTask): void;

   onSpawned?(
      child: ChildProcess,
      context: TaskContext & { command: string },
      controls: SpawnedControls
   ): void | TeardownStep;

   onError?(error: Maybe<Error>, result: GitExecutorResult, context: TaskContext): Maybe<Error>;
}
