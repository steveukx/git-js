import { InitResult } from '../../../typings';

export class InitSummary implements InitResult {
   constructor(
      public readonly bare: boolean,
      public readonly path: string,
      public readonly existing: boolean,
      public readonly gitDir: string
   ) {}
}

const initResponseRegex = /^Init.+ repository in (.+)$/;
const reInitResponseRegex = /^Rein.+ in (.+)$/;

export function parseInit(bare: boolean, path: string, text: string) {
   const response = String(text).trim();
   let result;

   if ((result = initResponseRegex.exec(response))) {
      return new InitSummary(bare, path, false, result[1]);
   }

   if ((result = reInitResponseRegex.exec(response))) {
      return new InitSummary(bare, path, true, result[1]);
   }

   let gitDir = '';
   const tokens = response.split(' ');
   while (tokens.length) {
      const token = tokens.shift();
      if (token === 'in') {
         gitDir = tokens.join(' ');
         break;
      }
   }

   return new InitSummary(bare, path, /^re/i.test(response), gitDir);
}
