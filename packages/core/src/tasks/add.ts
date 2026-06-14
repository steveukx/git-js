import { asArray } from '../parsing/parse.helpers';
import { stringTask } from '../task/task';
import type { StringTask } from '../task/task.types';

export type AddResult = string;

/**
 * Stages one or more paths. `files` accepts a single pathspec or an array; any
 * additional git flags are passed through as `customArgs`.
 */
export function add(files: string | string[], customArgs: string[] = []): StringTask<AddResult> {
   return stringTask(['add', ...asArray(files), ...customArgs]);
}
