import { StringTask } from '../types';
import { parseCheckIgnore } from '../responses/CheckIgnore';

export function checkIgnoreTask(paths: string[]): StringTask<string[]> {
   return {
      commands: ['check-ignore', ...paths],
      format: 'utf-8',
      parser: parseCheckIgnore,
   };
}
