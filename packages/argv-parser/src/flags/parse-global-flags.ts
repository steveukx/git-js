import { expandToken } from '../tokens/token-expander';
import type { Flag } from './flags.helpers';

export interface GlobalFlags {
   flags: Flag[];
   taskIndex: number;
}

export function parseGlobalFlags(tokens: readonly unknown[], flags: Flag[] = []): GlobalFlags {
   let i = 0;

   while (i < tokens.length) {
      const raw = String(tokens[i]);
      if (!raw.startsWith('-') || raw.length < 2) break;

      const parsed = expandToken(raw);
      let next = i + 1;

      for (const token of parsed) {
         const flag: Flag = {
            name: token.name,
            value: token.value,
            absorbedNext: false,
            isGlobal: true,
         };
         if (token.needsNext && flag.value === undefined && next < tokens.length) {
            flag.value = String(tokens[next]);
            flag.absorbedNext = true;
            next++;
         }
         flags.push(flag);
      }

      i = next;
   }

   return { flags, taskIndex: i };
}
