import { logFormatFromCommand } from '../args/log-format';
import { createListLogSummaryParser } from '../parsers/parse-list-log-summary';
import type { StringTask } from '../types';
import { asStringArray, filterArray, trailingOptionsArgument } from '../utils';
import { validateLogFormatConfig } from './diff';
import type { LogOptions, LogResult } from './log';
import { parseLogOptions } from './log';
import type { EmptyTask } from './task';

export function stashListTask(
   opt: LogOptions | undefined = {},
   customArgs: string[]
): EmptyTask | StringTask<LogResult> {
   // biome-ignore lint/suspicious/noExplicitAny: <narrowed by outer generic>
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

export function stashList(...args: unknown[]): EmptyTask | StringTask<LogResult> {
   const options = args[0];
   return stashListTask(
      trailingOptionsArgument(args) || {},
      asStringArray(filterArray(options) ? options : [])
   );
}
