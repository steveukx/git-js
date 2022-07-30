import { GrepResult, SimpleGit } from '../../../typings';
import { SimpleGitApi } from '../simple-git-api';
import {
   asNumber,
   forEachLineWithContent,
   getTrailingOptions,
   NULL,
   prefixedArray,
   trailingFunctionArgument,
} from '../utils';

import { configurationErrorTask } from './task';

const disallowedOptions = ['-h'];

const Query = Symbol('grepQuery');

export interface GitGrepQuery extends Iterable<string> {
   /** Adds one or more terms to be grouped as an "and" to any other terms */
   and(...and: string[]): this;

   /** Adds one or more search terms - git.grep will "or" this to other terms */
   param(...param: string[]): this;
}

class GrepQuery implements GitGrepQuery {
   private [Query]: string[] = [];

   *[Symbol.iterator]() {
      for (const query of this[Query]) {
         yield query;
      }
   }

   and(...and: string[]) {
      and.length && this[Query].push('--and', '(', ...prefixedArray(and, '-e'), ')');
      return this;
   }

   param(...param: string[]) {
      this[Query].push(...prefixedArray(param, '-e'));
      return this;
   }
}

/**
 * Creates a new builder for a `git.grep` query with optional params
 */
export function grepQueryBuilder(...params: string[]): GitGrepQuery {
   return new GrepQuery().param(...params);
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

export default function (): Pick<SimpleGit, 'grep'> {
   return {
      grep(this: SimpleGitApi, searchTerm: string | GitGrepQuery) {
         const then = trailingFunctionArgument(arguments);
         const options = getTrailingOptions(arguments);

         for (const option of disallowedOptions) {
            if (options.includes(option)) {
               return this._runTask(
                  configurationErrorTask(`git.grep: use of "${option}" is not supported.`),
                  then
               );
            }
         }

         if (typeof searchTerm === 'string') {
            searchTerm = grepQueryBuilder().param(searchTerm);
         }

         const commands = ['grep', '--null', '-n', '--full-name', ...options, ...searchTerm];

         return this._runTask(
            {
               commands,
               format: 'utf-8',
               parser(stdOut) {
                  return parseGrep(stdOut);
               },
            },
            then
         );
      },
   };
}
