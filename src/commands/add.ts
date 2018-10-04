import { AsyncResultCallback } from 'async';
import { nonParsedResponse } from '../responses/non-parsed-reponse';
import { Task } from '../interfaces/task';

export function add(files: string[], handler?: AsyncResultCallback<string, Error>): Task<string>  {

   const command = ['add', ...files];

   return {
      command,
      parser: nonParsedResponse,
      options: {},
      handler: handler,
   };
}
