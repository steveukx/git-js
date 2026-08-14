/**
 * The `InitResult` is returned when (re)initialising a git repo.
 */
export interface InitResult {
   /**
    * Boolean representing whether the `--bare` option was used
    */
   readonly bare: boolean;

   /**
    * Boolean representing whether the repo already existed (re-initialised rather than initialised)
    */
   readonly existing: boolean;

   /**
    * The path used when initialising
    */
   readonly path: string;

   /**
    * The git configuration directory - for a bare repo this is the same as `path`, in non-bare repos
    * this will usually be a sub-directory with the name `.git` (or value of the `$GIT_DIR` environment
    * variable).
    */
   readonly gitDir: string;
}

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

function gitDirFreshInit(response: string) {
   return initResponseRegex.exec(response)?.[1];
}

function gitDirReInit(response: string) {
   return reInitResponseRegex.exec(response)?.[1];
}

export function parseInit(bare: boolean, path: string, text: string): InitSummary {
   const response = String(text).trim();
   let result: string | undefined;

   if ((result = gitDirFreshInit(response))) {
      return new InitSummary(bare, path, false, result);
   }

   if ((result = gitDirReInit(response))) {
      return new InitSummary(bare, path, true, result);
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
