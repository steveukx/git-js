import { AsyncResultCallback } from 'async';
import { ListLogSummary } from '../responses/list-log-summary';
import { appendOptions, CommandOptionsObject } from '../util/command-builder';
import { nonParsedResponse } from '../responses/non-parsed-reponse';
import { Task } from '../interfaces/task';
import { MoveSummary } from '../responses/move-summary';

export function mv(from: string[], to: string, handler?: AsyncResultCallback<MoveSummary, Error>): Task<string>  {

   return {
      command: ['mv', '-v', ...from, to],
      parser: nonParsedResponse,
      options: {},
      handler: handler,
   };
}
