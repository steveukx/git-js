import { l10n, LocaleTokens } from './locals';

export interface RemoteRefs {
   fetch?: string;
   push?: string;
}

export class RemoteResponse {

   public refs: RemoteRefs = {};

   constructor (
      public name: string,
   ) {}

   static parse (output: string, verbose: boolean): RemoteResponse[] {
      const remotes: RemoteResponse[] = [];
      const cache: {[key: string]: RemoteResponse} = {};

      output
         .trim()
         .split('\n')
         .forEach((line: string) => {
            const detail = line.trim().split(/\s+/);
            const name = detail.shift();

            if (!name) {
               return;
            }

            if (!cache[name]) {
               cache[name] = remotes[remotes.length] = new RemoteResponse(name);
            }

            if (!verbose || !detail.length) {
               return;
            }

            switch ((detail.pop() as string).replace(/[^a-z]/g, '')) {
               case l10n[LocaleTokens.REMOTE_FETCH]:
                  cache[name].refs.fetch = detail.pop();
                  break;
               case l10n[LocaleTokens.REMOTE_PUSH]:
                  cache[name].refs.push = detail.pop();
                  break;
            }

      });

      return remotes;
   }
}

export class VerboseRemoteResponse {

}
