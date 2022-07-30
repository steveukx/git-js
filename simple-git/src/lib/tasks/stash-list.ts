import { LogOptions, LogResult } from '../../../typings';
import { logFormatFromCommand } from '../args/log-format';
import { createListLogSummaryParser } from '../parsers/parse-list-log-summary';
import type { StringTask } from '../types';
import { validateLogFormatConfig } from './diff';
import { parseLogOptions } from './log';
import type { EmptyTask } from './task';

export function stashListTask(
   opt: LogOptions = {},
   customArgs: string[]
): EmptyTask | StringTask<LogResult> {
   const options = parseLogOptions<any>(opt);
   const commands = ['stash', 'list', ...options.commands, ...customArgs];
   const parser = createListLogSummaryParser(
      options.splitter,
      options.fields,
      logFormatFromCommand(commands)
   );

   return (
      validateLogFormatConfig(commands) || {
         commands,
         format: 'utf-8',
         parser,
      }
   );
}
