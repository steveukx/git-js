import { Task } from '../interfaces/task';
import { AsyncResultCallback } from 'async';
import { appendOptions, CommandOptionsObject } from '../util/command-builder';
import { nonParsedResponse } from '../responses/non-parsed-reponse';

export function stash(commands: string[], options: CommandOptionsObject, handler?: AsyncResultCallback<string, Error>): Task<string> {

   const command = appendOptions(['stash', ...commands], options);

   return {
      command,
      parser: nonParsedResponse,
      options: {},
      handler: handler,
   };

}
