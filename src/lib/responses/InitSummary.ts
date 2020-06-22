import { InitResult } from '../../../typings';

export class InitSummary implements InitResult {
   constructor(
      public readonly bare: boolean,
      public readonly path: string,
      public readonly existing: boolean,
   ) {}
}

const initResponseRegex = /^Init.+ repository in (.+)$/;
const reInitResponseRegex = /^Rein.+ in (.+)$/;

export function parseInit(bare: boolean, text: string) {
   const response = String(text).trim();
   let result;

   if ((result = initResponseRegex.exec(response))) {
      return new InitSummary(bare, result[1], false);
   }

   if ((result = reInitResponseRegex.exec(response))) {
      return new InitSummary(bare, result[1], true);
   }

   let path = '';
   const tokens = response.split(' ');
   while (tokens.length) {
      const token = tokens.shift();
      if (token === 'in') {
         path = tokens.join(' ');
         break;
      }
   }

   return new InitSummary(bare, path, /^re/i.test(response));
}
