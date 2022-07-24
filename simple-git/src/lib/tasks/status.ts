import { StatusResult } from '../../../typings';
import { parseStatusSummary } from '../responses/StatusSummary';
import { StringTask } from '../types';

const ignoredOptions = ['--null', '-z'];

export function statusTask(customArgs: string[]): StringTask<StatusResult> {
   const commands = [
      'status',
      '--porcelain',
      '-b',
      '-u',
      '--null',
      ...customArgs.filter((arg) => !ignoredOptions.includes(arg)),
   ];

   return {
      format: 'utf-8',
      commands,
      parser(text: string) {
         return parseStatusSummary(text);
      },
   };
}
