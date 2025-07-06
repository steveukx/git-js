import { TaskConfigurationError } from '../errors/task-configuration-error';
import type { BufferTask, EmptyTaskParser, SimpleGitTask, StringTask } from '../types';

export const EMPTY_COMMANDS: [] = [];

export type EmptyTask = {
   commands: typeof EMPTY_COMMANDS;
   format: 'empty';
   parser: EmptyTaskParser;
   onError?: undefined;
};

export function adhocExecTask(parser: EmptyTaskParser): EmptyTask {
   return {
      commands: EMPTY_COMMANDS,
      format: 'empty',
      parser,
   };
}

export function configurationErrorTask(error: Error | string): EmptyTask {
   return {
      commands: EMPTY_COMMANDS,
      format: 'empty',
      parser() {
         throw typeof error === 'string' ? new TaskConfigurationError(error) : error;
      },
   };
}

export function straightThroughStringTask(commands: string[], trimmed = false): StringTask<string> {
   return {
      commands,
      format: 'utf-8',
      parser(text) {
         return trimmed ? String(text).trim() : text;
      },
   };
}

export function straightThroughBufferTask(commands: string[]): BufferTask<any> {
   return {
      commands,
      format: 'buffer',
      parser(buffer) {
         return buffer;
      },
   };
}

export function isBufferTask<R>(task: SimpleGitTask<R>): task is BufferTask<R> {
   return task.format === 'buffer';
}

export function isEmptyTask<R>(task: SimpleGitTask<R>): task is EmptyTask {
   return task.format === 'empty' || !task.commands.length;
}
