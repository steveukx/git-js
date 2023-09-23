import type { Options, StringTask } from '../types';
import type { LogResult, SimpleGit } from '../../../typings';
import { logFormatFromCommand } from '../args/log-format';
import { pathspec } from '../args/pathspec';
import {
   COMMIT_BOUNDARY,
   createListLogSummaryParser,
   SPLITTER,
   START_BOUNDARY,
} from '../parsers/parse-list-log-summary';
import {
   appendTaskOptions,
   filterArray,
   filterPrimitives,
   filterString,
   filterType,
   trailingFunctionArgument,
   trailingOptionsArgument,
} from '../utils';
import { SimpleGitApi } from '../simple-git-api';
import { configurationErrorTask } from './task';
import { validateLogFormatConfig } from './diff';

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
   const format =
      !filterPrimitives(opt.format) && opt.format
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

export default function (): Pick<SimpleGit, 'log'> {
   return {
      log<T extends Options>(this: SimpleGitApi, ...rest: unknown[]) {
         const next = trailingFunctionArgument(arguments);
         const options = parseLogOptions<T>(
            trailingOptionsArgument(arguments),
            filterType(arguments[0], filterArray)
         );
         const task =
            rejectDeprecatedSignatures(...rest) ||
            validateLogFormatConfig(options.commands) ||
            createLogTask(options);

         return this._runTask(task, next);
      },
   };

   function createLogTask(options: ParsedLogOptions) {
      return logTask(options.splitter, options.fields, options.commands);
   }

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
