import {
   asNumber,
   forEachLineWithContent,
   getTrailingOptions,
   NULL,
   prefixedArray,
} from '../utils';
import { configurationErrorTask, type EmptyTask, type StringTask } from './task';

/** Represents the response to git.grep */
export interface GrepResult {
   paths: Set<string>;
   results: Record<
      string,
      Array<{
         line: number;
         path: string;
         preview: string;
      }>
   >;
}

const disallowedOptions = ['-h'];

export interface GitGrepQuery extends Iterable<string> {
   /** Adds one or more terms to be grouped as an "and" to any other terms */
   and(...and: string[]): this;

   /** Adds one or more search terms - git.grep will "or" this to other terms */
   param(...param: string[]): this;
}

function grepQuery() {
   const query: string[] = [];
   const grep: GitGrepQuery = Object.create({
      and(...and: string[]) {
         and.length && query.push('--and', '(', ...prefixedArray(and, '-e'), ')');
         return grep;
      },
      param(...param: string[]) {
         query.push(...prefixedArray(param, '-e'));
         return grep;
      },
      *[Symbol.iterator]() {
         for (const item of query) {
            yield item;
         }
      },
   });
   return grep;
}

/**
 * Creates a new builder for a `git.grep` query with optional params
 */
export function grepQueryBuilder(...params: string[]): GitGrepQuery {
   return grepQuery().param(...params);
}

function parseGrep(grep: string): GrepResult {
   const paths: GrepResult['paths'] = new Set<string>();
   const results: GrepResult['results'] = {};

   forEachLineWithContent(grep, (input) => {
      const [path, line, preview] = input.split(NULL);
      paths.add(path);
      (results[path] = results[path] || []).push({
         line: asNumber(line),
         path,
         preview,
      });
   });

   return {
      paths,
      results,
   };
}

export function grep(
   searchTerm: string | GitGrepQuery,
   ...args: unknown[]
): StringTask<GrepResult> | EmptyTask {
   const options = getTrailingOptions([searchTerm, ...args]);

   for (const option of disallowedOptions) {
      if (options.includes(option)) {
         return configurationErrorTask(`git.grep: use of "${option}" is not supported.`);
      }
   }

   const query = typeof searchTerm === 'string' ? grepQueryBuilder().param(searchTerm) : searchTerm;

   const commands = ['grep', '--null', '-n', '--full-name', ...options, ...query];

   return {
      commands,
      format: 'utf-8',
      parser(stdOut) {
         return parseGrep(stdOut);
      },
   };
}
