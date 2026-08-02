import type { StatusResult } from '../responses/StatusSummary';
import { parseStatusSummary } from '../responses/StatusSummary';
import type { StringTask } from '../types';
import { getTrailingOptions } from '../utils';

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

export function status(...args: unknown[]): StringTask<StatusResult> {
   return statusTask(getTrailingOptions(args));
}
