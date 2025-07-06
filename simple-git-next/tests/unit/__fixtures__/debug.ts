import { expect, Mock, vi } from 'vitest';

vi.doMock('debug', () => {
   const out = vi.fn();

   function logger(name: string) {
      const log = out.bind(null, name);

      function extend(child: string) {
         return logger(`${name}:${child}`);
      }

      return Object.assign(log, {
         extend,
      });
   }

   return {
      out,
      default: Object.assign(logger, {
         formatters: {
            H: 'hello-world',
         },
      }),
   };
});

function logs(): Record<string, string[]> {
   return (require('debug') as Mock).mock.results[0].value.logs;
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
