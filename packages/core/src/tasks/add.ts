import type { VariadicOptions } from '../options/options.types';
import { asTaskOptions } from '../options/task-options';
import { asArray } from '../parsing/parse.helpers';
import { stringTask } from '../task/task';
import type { StringTask } from '../task/task.types';

export type AddResult = string;

/**
 * Stages one or more paths. `files` accepts a single pathspec or an array; any
 * further git flags follow as varargs strings, a string[] or an options object.
 */
export function add(files: string | string[], ...options: VariadicOptions): StringTask<AddResult> {
   return stringTask(['add', ...asArray(files), ...asTaskOptions(options)]);
}
