import { StringTask } from '../types';
import { DiffResult } from '../../../typings';
import { isLogFormat, LogFormat, logFormatFromCommand } from '../args/log-format';
import { getDiffParser } from '../parsers/parse-diff-summary';
import { configurationErrorTask, EmptyTask } from './task';

export function diffSummaryTask(customArgs: string[]): StringTask<DiffResult> {
   let logFormat = logFormatFromCommand(customArgs);

   const commands = ['diff'];

   if (logFormat === LogFormat.NONE) {
      logFormat = LogFormat.STAT;
      commands.push('--stat=4096');
   }

   commands.push(...customArgs);

   return {
      commands,
      format: 'utf-8',
      parser: getDiffParser(logFormat),
   }
}

export function validateSummaryOptions(customArgs: unknown[]): EmptyTask | void {
   const flags = customArgs.filter(isLogFormat);

   if (flags.length > 1) {
      return configurationErrorTask(`Summary flags are mutually exclusive - pick one of ${flags.join(',')}`);
   }
}
