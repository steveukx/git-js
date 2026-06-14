import type { StringTask } from '../task/task.types';

export interface InitResult {
   readonly bare: boolean;
   readonly path: string;
   readonly existing: boolean;
   readonly gitDir: string;
}

const BARE_FLAG = '--bare';
const initRegex = /^Init.+ repository in (.+)$/;
const reInitRegex = /^Rein.+ in (.+)$/;

export function parseInit(bare: boolean, path: string, text: string): InitResult {
   const response = text.trim();

   const initialised = initRegex.exec(response);
   if (initialised) {
      return { bare, path, existing: false, gitDir: initialised[1] };
   }

   const reInitialised = reInitRegex.exec(response);
   if (reInitialised) {
      return { bare, path, existing: true, gitDir: reInitialised[1] };
   }

   const tokens = response.split(' ');
   const inIndex = tokens.indexOf('in');
   const gitDir = inIndex === -1 ? '' : tokens.slice(inIndex + 1).join(' ');

   return { bare, path, existing: /^re/i.test(response), gitDir };
}

/**
 * Creates an empty git repository (or re-initialises an existing one) in `path`.
 * Passing `bare` adds `--bare` unless the caller already supplied it.
 */
export function init(
   bare = false,
   path = process.cwd(),
   customArgs: string[] = []
): StringTask<InitResult> {
   const commands = ['init', ...customArgs];
   if (bare && !commands.includes(BARE_FLAG)) {
      commands.splice(1, 0, BARE_FLAG);
   }

   return {
      format: 'utf-8',
      commands,
      parser: (stdOut) => parseInit(commands.includes(BARE_FLAG), path, stdOut),
   };
}
