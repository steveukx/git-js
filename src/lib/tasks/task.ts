import { TaskConfigurationError } from '../errors/task-configuration-error';
import { BufferTask, EmptyTaskParser, SimpleGitTask, SimpleGitTaskConfiguration, StringTask } from '../types';

export const EMPTY_COMMANDS: [] = [];

export type EmptyTask<RESPONSE = void> = SimpleGitTaskConfiguration<RESPONSE, 'utf-8', string> & {
   commands: typeof EMPTY_COMMANDS;
   parser: EmptyTaskParser<RESPONSE>;
};


export function adhocExecTask<R>(parser: () => R): StringTask<R> {
   return {
      commands: EMPTY_COMMANDS,
      format: 'utf-8',
      parser,
   }
}

export function configurationErrorTask(error: Error | string): EmptyTask {
   return {
      commands: EMPTY_COMMANDS,
      format: 'utf-8',
      parser() {
         throw typeof error === 'string' ? new TaskConfigurationError(error) : error;
      }
   }
}

export function straightThroughStringTask(commands: string[], trimmed = false): StringTask<string> {
   return {
      commands,
      format: 'utf-8',
      parser(text) {
         return trimmed ? String(text).trim() : text;
      },
   }
}

export function isBufferTask<R>(task: SimpleGitTask<R>): task is BufferTask<R> {
   return task.format === 'buffer';
}

export function isEmptyTask<R>(task: SimpleGitTask<R>): task is EmptyTask {
   return !task.commands.length;
}
