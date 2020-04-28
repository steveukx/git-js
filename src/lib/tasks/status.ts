import { StringTask } from './task';
import { parseStatusSummary, StatusSummary } from '../responses/StatusSummary';

export function statusTask (): StringTask<StatusSummary> {
   return {
      format: 'utf-8',
      commands: ['status', '--porcelain', '-b', '-u'],
      parser (text: string) {
         return parseStatusSummary(text);
      }
   }
}
