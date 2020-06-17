import { StringTask } from './task';
import { parseStatusSummary, StatusSummary } from '../responses/StatusSummary';

export function statusTask (path: string | undefined): StringTask<StatusSummary> {
   const commands = ['status', '--porcelain', '-b', '-u'];

   if (path !== undefined) commands.push(path);

   return {
      format: 'utf-8',
      commands: commands,
      parser (text: string) {
         return parseStatusSummary(text);
      }
   }
}
