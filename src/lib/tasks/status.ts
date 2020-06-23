import { StringTask } from './task';
import { parseStatusSummary, StatusSummary } from '../responses/StatusSummary';

export function statusTask (customArgs: string[]): StringTask<StatusSummary> {
   return {
      format: 'utf-8',
      commands: ['status', '--porcelain', '-b', '-u', ...customArgs],
      parser (text: string) {
         return parseStatusSummary(text);
      }
   }
}
