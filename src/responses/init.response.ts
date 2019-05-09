import { l10n, LocaleTokens } from './locals';

/**
 * The response describing both `git init` and `git init --bare` in any directory.
 */
export class InitResponse {

   constructor (
      /**
       * root The path to the root to the git repo
       */
      public root = '/',

      /**
       * existing Flag showing whether the repo is created from an existing source:
       *          when running `git init` in a folder already controlled by `git`,
       *          this will be `true`,
       */
      public existing = false,
   ) {}

   /**
    * Generates an InitResponse based on the string response from a `git init` command
    */
   static parse (output: string): InitResponse {
      const response = new InitResponse();

      const data = output.trim().split(l10n[LocaleTokens.INIT_REPO]);

      if (data && data.length > 1) {
         response.existing = l10n[LocaleTokens.INIT_EXISTING].test(data.shift() as string);
         response.root = String(data.pop());
      }

      return response;
   }

}
