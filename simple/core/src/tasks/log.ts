import { pathspec } from '@simple-git/args-pathspec';

import { logFormatFromCommand } from '../args/log-format';
import {
   COMMIT_BOUNDARY,
   createListLogSummaryParser,
   SPLITTER,
   START_BOUNDARY,
} from '../parsers/parse-list-log-summary';
import type { DiffResult } from '../responses/DiffSummary';
import type { Options } from '../types';
import {
   appendTaskOptions,
   asStringArray,
   filterArray,
   filterPlainObject,
   filterString,
   filterType,
   trailingOptionsArgument,
} from '../utils';
import { validateLogFormatConfig } from './diff';
import { configurationErrorTask, type EmptyTask, type StringTask } from './task';

/**
 * The ListLogLine represents a single entry in the `git.log`, the properties on the object
 * are mixed in depending on the names used in the format (see `DefaultLogFields`), but some
 * properties are dependent on the command used.
 */
export interface ListLogLine {
   /**
    * When using a `--stat=4096` or `--shortstat` options in the `git.log` or `git.stashList`,
    * each entry in the `ListLogSummary` will also have a `diff` property representing as much
    * detail as was given in the response.
    */
   diff?: DiffResult;
}

export interface LogResult<T = DefaultLogFields> {
   all: ReadonlyArray<T & ListLogLine>;
   total: number;
   latest: (T & ListLogLine) | null;
}

enum excludeOptions {
   '--pretty',
   'max-count',
   'maxCount',
   'n',
   'file',
   'format',
   'from',
   'to',
   'splitter',
   'symmetric',
   'mailMap',
   'multiLine',
   'strictDate',
}

export interface DefaultLogFields {
   hash: string;
   date: string;
   message: string;
   refs: string;
   body: string;
   author_name: string;
   author_email: string;
}

export type LogOptions<T = DefaultLogFields> = {
   file?: string;
   format?: T;
   from?: string;
   mailMap?: boolean;
   maxCount?: number;
   multiLine?: boolean;
   splitter?: string;
   strictDate?: boolean;
   symmetric?: boolean;
   to?: string;
};

interface ParsedLogOptions {
   fields: string[];
   splitter: string;
   commands: string[];
}

function prettyFormat(
   format: Record<string, string | unknown>,
   splitter: string
): [string[], string] {
   const fields: string[] = [];
   const formatStr: string[] = [];

   Object.keys(format).forEach((field) => {
      fields.push(field);
      formatStr.push(String(format[field]));
   });

   return [fields, formatStr.join(splitter)];
}

function userOptions<T extends Options>(input: T): Options {
   return Object.keys(input).reduce((out, key) => {
      if (!(key in excludeOptions)) {
         out[key] = input[key];
      }
      return out;
   }, {} as Options);
}

export function parseLogOptions<T extends Options>(
   opt: Options | LogOptions<T> = {},
   customArgs: string[] = []
): ParsedLogOptions {
   const splitter = filterType(opt.splitter, filterString, SPLITTER);
   const format = filterPlainObject(opt.format)
      ? opt.format
      : {
           hash: '%H',
           date: opt.strictDate === false ? '%ai' : '%aI',
           message: '%s',
           refs: '%D',
           body: opt.multiLine ? '%B' : '%b',
           author_name: opt.mailMap !== false ? '%aN' : '%an',
           author_email: opt.mailMap !== false ? '%aE' : '%ae',
        };

   const [fields, formatStr] = prettyFormat(format, splitter);

   const suffix: string[] = [];
   const command: string[] = [
      `--pretty=format:${START_BOUNDARY}${formatStr}${COMMIT_BOUNDARY}`,
      ...customArgs,
   ];

   // biome-ignore lint/suspicious/noExplicitAny: <inline type checking>
   const maxCount: number | undefined = (opt as any).n || (opt as any)['max-count'] || opt.maxCount;
   if (maxCount) {
      command.push(`--max-count=${maxCount}`);
   }

   if (opt.from || opt.to) {
      const rangeOperator = opt.symmetric !== false ? '...' : '..';
      suffix.push(`${opt.from || ''}${rangeOperator}${opt.to || ''}`);
   }

   if (filterString(opt.file)) {
      command.push('--follow', pathspec(opt.file));
   }

   appendTaskOptions(userOptions(opt as Options), command);

   return {
      fields,
      splitter,
      commands: [...command, ...suffix],
   };
}

export function logTask<T>(
   splitter: string,
   fields: string[],
   customArgs: string[]
): StringTask<LogResult<T>> {
   const parser = createListLogSummaryParser(splitter, fields, logFormatFromCommand(customArgs));

   return {
      commands: ['log', ...customArgs],
      format: 'utf-8',
      parser,
   };
}

export function log<T extends Options = Options>(
   ...args: unknown[]
): StringTask<LogResult<T>> | EmptyTask {
   const options = parseLogOptions<T>(
      trailingOptionsArgument(args),
      asStringArray(filterType(args[0], filterArray, []))
   );

   return (
      rejectDeprecatedSignatures(args[0], args[1]) ||
      validateLogFormatConfig(options.commands) ||
      logTask<T>(options.splitter, options.fields, options.commands)
   );

   function rejectDeprecatedSignatures(from?: unknown, to?: unknown) {
      return (
         filterString(from) &&
         filterString(to) &&
         configurationErrorTask(
            `git.log(string, string) should be replaced with git.log({ from: string, to: string })`
         )
      );
   }
}
