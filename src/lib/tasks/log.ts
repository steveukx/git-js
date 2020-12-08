import { Options, StringTask } from '../types';
import { LogResult } from '../../../typings';
import {
   COMMIT_BOUNDARY,
   createListLogSummaryParser,
   SPLITTER,
   START_BOUNDARY
} from '../parsers/parse-list-log-summary';
import { appendTaskOptions } from '../utils';

const excludeOptions = new Set([
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
   'multiLine',
   'strictDate',
]);

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
   maxCount?: number;
   multiLine?: boolean;
   splitter?: string;
   strictDate?: boolean;
   symmetric?: boolean;
   to?: string;
};

function prettyFormat(format: Object, splitter: string): [string[], string] {
   const fields: string[] = [];
   const formatStr: string[] = [];

   Object.entries(format).forEach(([field, format]) => {
      fields.push(field);
      formatStr.push(format);
   });

   return [
      fields, formatStr.join(splitter)
   ];
}

function userOptions(options: Object) {
   return Object.fromEntries(
      Object.entries(options).filter(([key]) => !excludeOptions.has(key))
   );
}

export function parseLogOptions<T extends Options>(opt: LogOptions<T> = {}, customArgs: string[] = []) {
   const splitter = opt.splitter || SPLITTER;
   const format = opt.format || {
      hash: '%H',
      date: opt.strictDate === false ? '%ai' : '%aI',
      message: '%s',
      refs: '%D',
      body: opt.multiLine ? '%B' : '%b',
      author_name: '%aN',
      author_email: '%ae'
   };

   const [fields, formatStr] = prettyFormat(format, splitter);

   const suffix: string[] = [];
   const command: string[] = [
      `--pretty=format:${START_BOUNDARY}${formatStr}${COMMIT_BOUNDARY}`,
      ...customArgs,
   ];

   const maxCount: number | undefined = (opt as any).n || (opt as any)['max-count'] || opt.maxCount;
   if (maxCount) {
      command.push(`--max-count=${ maxCount }`);
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
