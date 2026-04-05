import { GLOBAL } from './flag-specs';

/** Parse a single raw token (e.g. `'-m'`, `'--amend'`, `'-uc'`) into one or
 *  more switch descriptors.  Values are not yet resolved for needsNext=true. */
export function expandToken(
   raw: string,
   spec = GLOBAL
): Array<{
   name: string;
   value?: string;
   needsNext: boolean;
}> {
   if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq > 2) {
         return [{ name: raw.slice(0, eq), value: raw.slice(eq + 1), needsNext: false }];
      }
      const stem = raw.slice(2);
      return [{ name: raw, needsNext: spec.long.has(stem) }];
   }

   // Single short switch
   if (raw.length === 2) {
      const char = raw.charAt(1);
      const consumes = spec.short.get(char);
      return [{ name: raw, needsNext: consumes === true }];
   }

   // Combined short cluster: try to expand char-by-char
   return expandCluster(raw, spec.short);
}

function expandCluster(
   raw: string,
   shortSpec: ReadonlyMap<string, boolean>
): Array<{ name: string; value?: string; needsNext: boolean }> {
   const chars = raw.slice(1).split('');
   const result: Array<{ name: string; value?: string; needsNext: boolean }> = [];

   for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const consumes = shortSpec.get(char);

      if (consumes === undefined) {
         // Unknown char: keep the whole raw token as opaque
         return [{ name: raw, needsNext: false }];
      }

      if (consumes) {
         const remainder = chars.slice(i + 1).join('');
         if (remainder) {
            const remainderAllKnown = [...remainder].every((c) => shortSpec.has(c));
            if (!remainderAllKnown) {
               // Remaining chars are the embedded value, not separate flags
               result.push({ name: `-${char}`, value: remainder, needsNext: false });
               return result;
            }
         }
      }

      result.push({ name: `-${char}`, needsNext: consumes });
   }

   return result;
}
