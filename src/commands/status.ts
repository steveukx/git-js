import { StatusSummary } from '../responses/status-summary';
import { Task } from '../interfaces/task';
import { AsyncResultCallback } from 'async';

export function status (handler?: AsyncResultCallback<StatusSummary, Error>): Task<StatusSummary> {

   return {
      command: ['status', '--porcelain', '-b', '-u'],
      parser: StatusSummary.parse,
      options: {},
      handler: handler,
   };

}
