import { LogOptions, LogResult } from '../../../typings';
import { logFormatFromCommand } from '../args/log-format';
import { createListLogSummaryParser } from '../parsers/parse-list-log-summary';
import { StringTask } from '../types';
import { parseLogOptions } from './log';

export function stashListTask(opt: LogOptions = {}, customArgs: string[]): StringTask<LogResult> {
   const options = parseLogOptions<any>(opt);
   const commands = ['stash', 'list', ...options.commands, ...customArgs];
   const parser = createListLogSummaryParser(options.splitter, options.fields, logFormatFromCommand(commands));

   return {
      commands,
      format: 'utf-8',
      parser,
   };
}
