import { l10n, LocaleTokens } from './locals';

export class AddResponse {

   constructor(
      /**
       * added The files that were added
       */
      public added: string[],
   ) {
   }

   /**
    * Generates an AddResponse based on the string response from a `git add` command
    */
   static parse(output: string): AddResponse {
      const addFileRegExp = new RegExp(`^${ l10n[LocaleTokens.ADD_ADD] }\\s['"](.+)['"]$`);
      const lineToFilePath = (line: string): string => {
         const match = addFileRegExp.exec(line);
         return match && match[1] || '';
      };

      return new AddResponse(
         output.trim()
            .split('\n')
            .map(lineToFilePath)
            .filter(Boolean)
      );

   }

}
