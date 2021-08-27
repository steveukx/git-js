import { Options, StringTask } from '../types';
import { LogResult, SimpleGit } from '../../../typings';
import {
   COMMIT_BOUNDARY,
   createListLogSummaryParser,
   SPLITTER,
   START_BOUNDARY
} from '../parsers/parse-list-log-summary';
import {
   appendTaskOptions,
   filterArray,
   filterString,
   filterType,
   trailingFunctionArgument,
   trailingOptionsArgument
} from '../utils';
import { SimpleGitApi } from '../simple-git-api';
import { configurationErrorTask } from './task';

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
   commands: string[]
}

function prettyFormat(format: { [key: string]: string | unknown }, splitter: string): [string[], string] {
   const fields: string[] = [];
   const formatStr: string[] = [];

   Object.keys(format).forEach((field) => {
      fields.push(field);
      formatStr.push(String(format[field]));
   });

   return [
      fields, formatStr.join(splitter)
   ];
}

function userOptions<T>(input: T): Exclude<Omit<T, keyof typeof excludeOptions>, undefined> {
   const output = {...input};
   Object.keys(input).forEach(key => {
      if (key in excludeOptions) {
         delete output[key as keyof T];
      }
   });
   return output;
}

export function parseLogOptions<T extends Options>(opt: LogOptions<T> = {}, customArgs: string[] = []): ParsedLogOptions {
   const splitter = opt.splitter || SPLITTER;
   const format = opt.format || {
      hash: '%H',
      date: opt.strictDate === false ? '%ai' : '%aI',
      message: '%s',
      refs: '%D',
      body: opt.multiLine ? '%B' : '%b',
      author_name: opt.mailMap !== false ? '%aN' : '%an',
      author_email: opt.mailMap !== false ? '%aE' : '%ae'
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

   if (opt.from && opt.to) {
      const rangeOperator = (opt.symmetric !== false) ? '...' : '..';
      suffix.push(`${opt.from}${rangeOperator}${opt.to}`);
   }

   if (opt.file) {
      suffix.push('--follow', opt.file);
   }

   appendTaskOptions(userOptions(opt), command);

   return {
      fields,
      splitter,
      commands: [
         ...command,
         ...suffix,
      ],
   };
}

export function logTask<T>(splitter: string, fields: string[], customArgs: string[]): StringTask<LogResult<T>> {
   return {
      commands: ['log', ...customArgs],
      format: 'utf-8',
      parser: createListLogSummaryParser(splitter, fields),
   };
}

export default function (): Pick<SimpleGit, 'log'> {
   return {
      log<T extends Options>(this: SimpleGitApi, ...rest: unknown[]) {
         const next = trailingFunctionArgument(arguments);
         const task = rejectDeprecatedSignatures(...rest) ||
            createLogTask(parseLogOptions<T>(trailingOptionsArgument(arguments), filterType(arguments[0], filterArray)))

         return this._runTask(task, next);
      }
   }

   function createLogTask(options: ParsedLogOptions) {
      return logTask(options.splitter, options.fields, options.commands);
   }

   function rejectDeprecatedSignatures(from?: unknown, to?: unknown) {
      return (
         filterString(from) &&
         filterString(to) &&
         configurationErrorTask(`git.log(string, string) should be replaced with git.log({ from: string, to: string })`)
      );
   }
}
