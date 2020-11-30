import { StringTask } from '../types';
import { DiffResult } from '../../../typings';
import { parseDiffResult } from '../parsers/parse-diff-summary';

export function diffSummaryTask(customArgs: string[]): StringTask<DiffResult> {
   return {
      commands: ['diff', '--stat=4096', ...customArgs],
      format: 'utf-8',
      parser (stdOut) {
         return parseDiffResult(stdOut);
      }
   }
}
