import { forEachLineWithContent } from '../utils';

export interface RemoteWithoutRefs {
   name: string;
}

export interface RemoteWithRefs extends RemoteWithoutRefs {
   refs: {
      fetch: string;
      push: string;
   };
}

export function parseGetRemotes(text: string): RemoteWithoutRefs[] {
   const remotes: { [name: string]: RemoteWithoutRefs } = {};

   forEach(text, ([name]) => (remotes[name] = { name }));

   return Object.values(remotes);
}

export function parseGetRemotesVerbose(text: string): RemoteWithRefs[] {
   const remotes: { [name: string]: RemoteWithRefs } = {};

   forEach(text, ([name, url, purpose]) => {
      if (!remotes.hasOwnProperty(name)) {
         remotes[name] = {
            name: name,
            refs: { fetch: '', push: '' },
         };
      }

      if (purpose && url) {
         remotes[name].refs[purpose.replace(/[^a-z]/g, '') as keyof RemoteWithRefs['refs']] = url;
      }
   });

   return Object.values(remotes);
}

function forEach(text: string, handler: (line: string[]) => void) {
   forEachLineWithContent(text, (line) => handler(line.split(/\s+/)));
}
