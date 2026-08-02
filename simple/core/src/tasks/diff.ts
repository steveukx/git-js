import { isLogFormat, LogFormat, logFormatFromCommand } from '../args/log-format';
import { getDiffParser } from '../parsers/parse-diff-summary';
import type { DiffResult } from '../responses/DiffSummary';
import type { StringTask } from '../types';
import { filterString, getTrailingOptions } from '../utils';
import { configurationErrorTask, type EmptyTask, straightThroughStringTask } from './task';

export function diffSummaryTask(customArgs: string[]): StringTask<DiffResult> | EmptyTask {
   let logFormat = logFormatFromCommand(customArgs);

   const commands = ['diff'];

   if (logFormat === LogFormat.NONE) {
      logFormat = LogFormat.STAT;
      commands.push('--stat=4096');
   }

   commands.push(...customArgs);

   return (
      validateLogFormatConfig(commands) || {
         commands,
         format: 'utf-8',
         parser: getDiffParser(logFormat),
      }
   );
}

export function validateLogFormatConfig(customArgs: unknown[]): EmptyTask | void {
   const flags = customArgs.filter(isLogFormat);

   if (flags.length > 1) {
      return configurationErrorTask(
         `Summary flags are mutually exclusive - pick one of ${flags.join(',')}`
      );
   }

   if (flags.length && customArgs.includes('-z')) {
      return configurationErrorTask(
         `Summary flag ${flags} parsing is not compatible with null termination option '-z'`
      );
   }
}

export function diff(...args: unknown[]): StringTask<string> | EmptyTask {
   return filterString(args[0])
      ? configurationErrorTask(
           'git.diff: supplying options as a single string is no longer supported, switch to an array of strings'
        )
      : straightThroughStringTask(['diff', ...getTrailingOptions(args)]);
}

export function diffSummary(...args: unknown[]): StringTask<DiffResult> | EmptyTask {
   return diffSummaryTask(getTrailingOptions(args, 1));
}
