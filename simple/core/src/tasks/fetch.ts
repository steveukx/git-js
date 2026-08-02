import { filterString, filterType, getTrailingOptions } from '../utils';
export interface FetchResult {
   raw: string;
   remote: string | null;
   branches: {
      name: string;
      tracking: string;
   }[];
   tags: {
      name: string;
      tracking: string;
   }[];
   updated: {
      name: string;
      tracking: string;
      to: string;
      from: string;
   }[];
   deleted: {
      tracking: string;
   }[];
}

import { parseFetchResult } from '../parsers/parse-fetch';
import type { StringTask } from '../types';
import { configurationErrorTask, type EmptyTask } from './task';

function disallowedCommand(command: string) {
   return /^--upload-pack(=|$)/.test(command);
}

export function fetchTask(
   remote: string,
   branch: string,
   customArgs: string[]
): StringTask<FetchResult> | EmptyTask {
   const commands = ['fetch', ...customArgs];
   if (remote && branch) {
      commands.push(remote, branch);
   }

   const banned = commands.find(disallowedCommand);
   if (banned) {
      return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
   }

   return {
      commands,
      format: 'utf-8',
      parser: parseFetchResult,
   };
}

export function fetch(...args: unknown[]): StringTask<FetchResult> | EmptyTask {
   return fetchTask(
      filterType(args[0], filterString) || '',
      filterType(args[1], filterString) || '',
      getTrailingOptions(args)
   );
}
