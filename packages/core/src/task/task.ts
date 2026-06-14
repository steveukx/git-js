import { TaskConfigurationError } from '../errors/task-configuration-error';
import type { BufferTask, EmptyTask, EmptyTaskParser, GitTask, StringTask } from './task.types';

const NO_COMMANDS: readonly [] = [];

/**
 * A task that runs no git command, deferring entirely to its parser. Used to model
 * side-effect-only or pre-computed responses within the same descriptor pipeline.
 */
export function emptyTask<RESPONSE>(parser: EmptyTaskParser<RESPONSE>): EmptyTask<RESPONSE> {
   return {
      format: 'empty',
      commands: NO_COMMANDS,
      parser,
   };
}

/**
 * An empty task whose parser throws — the canonical way for a task factory to report
 * that the arguments it was given cannot produce a valid command. A string is
 * wrapped in a {@link TaskConfigurationError}.
 */
export function configurationErrorTask(error: Error | string): EmptyTask<never> {
   return emptyTask(() => {
      throw typeof error === 'string' ? new TaskConfigurationError(error) : error;
   });
}

/** A task whose utf-8 output is returned verbatim (optionally trimmed). */
export function stringTask(commands: string[], trimmed = false): StringTask<string> {
   return {
      format: 'utf-8',
      commands,
      parser: (stdOut) => (trimmed ? stdOut.trim() : stdOut),
   };
}

/** A task whose raw output is returned as a Buffer without conversion. */
export function bufferTask(commands: string[]): BufferTask<Buffer> {
   return {
      format: 'buffer',
      commands,
      parser: (stdOut) => stdOut,
   };
}

export function isBufferTask<RESPONSE>(task: GitTask<RESPONSE>): task is BufferTask<RESPONSE> {
   return task.format === 'buffer';
}

export function isEmptyTask<RESPONSE>(task: GitTask<RESPONSE>): task is EmptyTask<RESPONSE> {
   return task.format === 'empty' || task.commands.length === 0;
}
