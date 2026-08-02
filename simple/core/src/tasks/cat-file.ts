import {
   type BufferTask,
   configurationErrorTask,
   type EmptyTask,
   type StringTask,
   straightThroughBufferTask,
   straightThroughStringTask,
} from './task';

const OPTIONS_ERROR = 'Git.catFile: options must be supplied as an array of strings';

function catFileCommands(options: string[] | unknown): string[] | undefined {
   if (typeof options === 'string') {
      return undefined;
   }

   const commands = ['cat-file'];
   if (Array.isArray(options)) {
      commands.push(...options);
   }

   return commands;
}

/**
 * Returns a list of objects in a tree based on commit hash. Passing in an
 * object hash returns the object's content, size, and type.
 */
export function catFile(options?: string[]): StringTask<string> | EmptyTask {
   const commands = catFileCommands(options);
   return commands ? straightThroughStringTask(commands) : configurationErrorTask(OPTIONS_ERROR);
}

export function binaryCatFile(options?: string[]): BufferTask<Buffer> | EmptyTask {
   const commands = catFileCommands(options);
   return commands ? straightThroughBufferTask(commands) : configurationErrorTask(OPTIONS_ERROR);
}
