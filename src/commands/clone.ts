import { AsyncResultCallback } from 'async';
import { ListLogSummary } from '../responses/list-log-summary';
import { appendOptions, CommandOptionsObject } from '../util/command-builder';
import { nonParsedResponse } from '../responses/non-parsed-reponse';
import { Task } from '../interfaces/task';

export function clone(commands: string[], options: CommandOptionsObject, handler?: AsyncResultCallback<ListLogSummary, Error>): Task<string>  {

   const command = appendOptions(['clone', ...commands], options);

   return {
      command,
      parser: nonParsedResponse,
      options: {},
      handler: handler,
   };
}
