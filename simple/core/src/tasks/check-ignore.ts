import { parseCheckIgnore } from '../responses/CheckIgnore';
import type { StringTask } from '../types';
import { asArray, filterStringOrStringArray, filterType } from '../utils';

export function checkIgnoreTask(paths: string[]): StringTask<string[]> {
   return {
      commands: ['check-ignore', ...paths],
      format: 'utf-8',
      parser: parseCheckIgnore,
   };
}

export function checkIgnore(pathnames: string | string[]): StringTask<string[]> {
   return checkIgnoreTask(asArray(filterType(pathnames, filterStringOrStringArray, [])));
}
