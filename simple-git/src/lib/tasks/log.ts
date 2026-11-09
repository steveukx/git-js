import { pathspec } from '@simple-git/args-pathspec';

import type { LogResult, Options, SimpleGit } from '../../typings';
import { logFormatFromCommand } from '../args/log-format';
import {
   COMMIT_BOUNDARY,
   createListLogSummaryParser,
   SPLITTER,
   START_BOUNDARY,
} from '../parsers/parse-list-log-summary';
import type { SimpleGitApi } from '../simple-git-api';
import type { StringTask } from '../types';
import {
   appendTaskOptions,
   asStringArray,
   filterArray,
   filterPlainObject,
   filterString,
   filterType,
   trailingFunctionArgument,
   trailingOptionsArgument,
} from '../utils';
import { validateLogFormatConfig } from './diff';
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

/**
 * Options for the {@link SimpleGit.log | git.log} task, can be combined with any other options
 * supported by `git log` in the same object (see {@link TaskOptions}).
 *
 * When only one of `from` and `to` is supplied, the omitted value is equivalent to `HEAD`.
 * For any other commit, explicitly supply both (for example use `await git.firstCommit()` as
 * the value of `from` to log since the first commit of the repo).
 */
export type LogOptions<T = DefaultLogFields> = {
   /**
    * Path to a file in the repository, only commits that affect this path are included.
    */
   file?: string;
   /**
    * Custom log format object, the keys are the property names used on each returned commit and
    * the values are [pretty format](https://git-scm.com/docs/pretty-formats) placeholders, for
    * example `{ hash: '%H', subject: '%s' }`.
    */
   format?: T;
   /**
    * The oldest commit in the range to return, use along with `to` to set a bounded range.
    */
   from?: string;
   /**
    * Use the [mail map](https://git-scm.com/docs/gitmailmap) for the name and email values of the
    * default format (defaults to `true`).
    */
   mailMap?: boolean;
   /**
    * Equivalent to setting the `--max-count` option.
    */
   maxCount?: number;
   /**
    * Include multi-line body values in the default format (defaults to `false`).
    */
   multiLine?: boolean;
   /**
    * Character sequence used as the delimiter between fields in the log, should be a value that
    * doesn't appear in any commit message (defaults to `ò`).
    */
   splitter?: string;
   /**
    * Switches the authored date from an ISO 8601-like format to strict ISO 8601 format.
    */
   strictDate?: boolean;
   /**
    * Use a [symmetric revision range](https://git-scm.com/docs/gitrevisions#_dotted_range_notations)
    * (`from...to`) rather than a two-dot range (defaults to `true`).
    */
   symmetric?: boolean;
   /**
    * The newest commit in the range to return, use along with `from` to set a bounded range.
    */
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
            asStringArray(filterType(arguments[0], filterArray, []))
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
