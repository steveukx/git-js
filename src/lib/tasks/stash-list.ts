import { LogOptions, LogResult } from '../../../typings';
import { createListLogSummaryParser } from '../parsers/parse-list-log-summary';
import { StringTask } from '../types';
import { parseLogOptions } from './log';

export function stashListTask(opt: LogOptions = {}, customArgs: string[]): StringTask<LogResult> {
   const options = parseLogOptions<any>(opt);
   const parser = createListLogSummaryParser(options.splitter, options.fields);

   return {
      commands: ['stash', 'list', ...options.commands, ...customArgs],
      format: 'utf-8',
      parser,
   };
}
