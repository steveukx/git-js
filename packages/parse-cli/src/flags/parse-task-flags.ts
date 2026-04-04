import { Flag } from './flags.helpers';
import { getFlagSpecForTask } from '../tokens/flag-specs';
import { isPathSpec, toPaths } from '../pathspec';
import { expandToken } from '../tokens/token-expander';

type TaskFlags = {
   flags: Flag[];
   positionals: string[];
   pathspecs: string[];
};

export function parseTaskFlags(
   tokens: readonly unknown[],
   task: string | null,
   flags: Flag[] = []
): TaskFlags {
   const spec = getFlagSpecForTask(task);
   const positionals: string[] = [];
   const pathspecs: string[] = [];

   let i = 0;
   while (i < tokens.length) {
      const current = tokens[i];

      if (isPathSpec(current)) {
         pathspecs.push(...toPaths(current as string));
         i++;
         continue;
      }

      const raw = String(current);

      if (raw === '--') {
         for (let j = i + 1; j < tokens.length; j++) {
            const t = tokens[j];
            isPathSpec(t) ? pathspecs.push(...toPaths(t as string)) : pathspecs.push(String(t));
         }
         break;
      }

      if (!raw.startsWith('-') || raw.length < 2) {
         positionals.push(raw);
         i++;
         continue;
      }

      const parsed = expandToken(raw, spec);
      let next = i + 1;

      for (const token of parsed) {
         const flag: Flag = {
            name: token.name,
            value: token.value,
            absorbedNext: false,
            isGlobal: false,
         };
         if (
            token.needsNext &&
            flag.value === undefined &&
            next < tokens.length &&
            !isPathSpec(tokens[next])
         ) {
            flag.value = String(tokens[next]);
            flag.absorbedNext = true;
            next++;
         }
         flags.push(flag);
      }

      i = next;
   }

   return { flags, positionals, pathspecs };
}
