export interface Flag {
   name: string;
   value?: string;
   /** Value came from the next token rather than being embedded after `=`. */
   absorbedNext: boolean;
   /** Switch appeared before the git sub-command. */
   isGlobal: boolean;
}

export function* scopedFlags(flags: Flag[], scope: 'global' | 'task') {
   const findGlobal = scope === 'global';
   for (const flag of flags) {
      if (flag.isGlobal === findGlobal) {
         yield flag;
      }
   }
}
