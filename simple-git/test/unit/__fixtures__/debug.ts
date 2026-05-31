import { type Mock, expect } from 'vitest';
import debugModule from 'debug';

function logs(): Record<string, string[]> {
   return (debugModule as unknown as Mock).mock.results[0].value.logs;
}

export function $logNames(...matching: RegExp[]) {
   return Object.keys(logs()).filter(matches);

   function matches(namespace: string) {
      return !matching.length || matching.some((regex) => regex.test(namespace));
   }
}

export function $logMessagesFor(name: string) {
   const log = logs()[name];

   expect(Array.isArray(log)).toBe(true);

   return log.join('\n');
}
