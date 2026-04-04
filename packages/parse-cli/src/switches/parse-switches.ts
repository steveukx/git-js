import { InternalSwitch } from './switches.types';
import { expandToken } from '../tokens/token-expander';
import { getTaskSwitches } from '../tokens/token-switches';
import { isPathSpec, toPaths } from '../pathspec';

export interface GlobalSwitches {
   switches: InternalSwitch[];
   taskIndex: number;
}

export function parseGlobalSwitches(tokens: readonly unknown[]): GlobalSwitches {
   const switches: InternalSwitch[] = [];
   let i = 0;

   while (i < tokens.length) {
      const raw = String(tokens[i]);
      if (!raw.startsWith('-') || raw.length < 2) break;

      const parsed = expandToken(raw);
      let next = i + 1;

      for (const t of parsed) {
         const sw: InternalSwitch = {
            name: t.name,
            value: t.value,
            absorbedNext: false,
            isGlobal: true,
         };
         if (t.needsNext && sw.value === undefined && next < tokens.length) {
            sw.value = String(tokens[next]);
            sw.absorbedNext = true;
            next++;
         }
         switches.push(sw);
      }

      i = next;
   }

   return { switches, taskIndex: i };
}

type TaskSwitches = {
   switches: InternalSwitch[];
   positionals: string[];
   pathspecs: string[];
};

export function parseTaskSwitches(tokens: readonly unknown[], task: string | null): TaskSwitches {
   const spec = getTaskSwitches(task);
   const switches: InternalSwitch[] = [];
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

      for (const t of parsed) {
         const sw: InternalSwitch = {
            name: t.name,
            value: t.value,
            absorbedNext: false,
            isGlobal: false,
         };
         if (
            t.needsNext &&
            sw.value === undefined &&
            next < tokens.length &&
            !isPathSpec(tokens[next])
         ) {
            sw.value = String(tokens[next]);
            sw.absorbedNext = true;
            next++;
         }
         switches.push(sw);
      }

      i = next;
   }

   return { switches, positionals, pathspecs };
}
