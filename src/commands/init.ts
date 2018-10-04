import { AsyncResultCallback } from 'async';
import { nonParsedResponse } from '../responses/non-parsed-reponse';
import { Task } from '../interfaces/task';

export function init(bare: boolean, handler?: AsyncResultCallback<string, Error>): Task<string>  {

   const command = ['init'];

   if (bare) {
      command.push('--bare');
   }

   return {
      command,
      parser: nonParsedResponse,
      options: {},
      handler: handler,
   };
}
