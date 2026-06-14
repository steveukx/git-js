import { pathspec } from '@simple-git/args-pathspec';

import type { VariadicOptions } from '../options/options.types';
import { asTaskOptions } from '../options/task-options';
import { asArray, toLinesWithContent } from '../parsing/parse.helpers';
import type { StringTask } from '../task/task.types';

export type LsFilesResult = string[];

/**
 * Lists tracked files, optionally limited to `paths`. Each path is wrapped with
 * `pathspec` so a value that looks like a flag (e.g. `-x`) is treated as a path
 * rather than smuggled in as an option. Resolves the matching paths, one per line.
 */
export function lsFiles(
   paths: string | string[] = [],
   ...options: VariadicOptions
): StringTask<LsFilesResult> {
   const commands = ['ls-files', ...asTaskOptions(options)];

   for (const path of asArray(paths)) {
      commands.push(pathspec(path));
   }

   return {
      format: 'utf-8',
      commands,
      parser: (stdOut) => toLinesWithContent(stdOut),
   };
}
