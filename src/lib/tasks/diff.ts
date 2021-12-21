import { StringTask } from '../types';
import { DiffResult } from '../../../typings';
import { parseDiffResult } from '../parsers/parse-diff-summary';

export function diffSummaryTask(customArgs: string[]): StringTask<DiffResult> {
   return {
      commands: ['diff', '--shortstat', customArgs[0]+'..'+customArgs[1]],
      format: 'utf-8',
      parser (stdOut) {
         return parseDiffResult(stdOut);
      }
   }
}
