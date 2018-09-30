import { Task } from '../interfaces/task';
import { AsyncResultCallback } from 'async';
import { COMMIT_BOUNDARY, ListLogSummary } from '../responses/list-log-summary';
import { CommandOptionsObject } from '../util/command-builder';

export interface StashListOptions extends CommandOptionsObject {
   splitter?: string;
}

export function stashList (commands: string[], options: StashListOptions, handler?: AsyncResultCallback<ListLogSummary, Error>): Task<ListLogSummary> {

   const splitter = options.splitter || ';;;;';
   const command = [
      "stash",
      "list",
      "--pretty=format:%H %ai %s%d %aN %ae".replace(/\s+/g, splitter) + COMMIT_BOUNDARY,
      ...commands,
   ];

   return {
      command,
      parser: ListLogSummary.parser(splitter),
      options: {},
      handler: handler,
   };

}
