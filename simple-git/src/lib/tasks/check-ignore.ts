import { parseCheckIgnore } from '../responses/CheckIgnore';
import { StringTask } from '../types';

export function checkIgnoreTask(paths: string[]): StringTask<string[]> {
   return {
      commands: ['check-ignore', ...paths],
      format: 'utf-8',
      parser: parseCheckIgnore,
   };
}
