jest.mock('debug', () => {
   function logger(name: string, logs: any) {
      logs[name] = logs[name] || [];

      return Object.assign(
         (_: string, ...messages: Array<string | unknown>) => {
            logs[name].push(
               messages.filter((m) => typeof m === 'string' || Buffer.isBuffer(m)).join(' ')
            );
         },
         {
            extend(suffix: string) {
               return debug(`${name}:${suffix}`);
            },
            get logs() {
               return logs;
            },
         }
      );
   }

   const debug: any = Object.assign(
      jest.fn((name) => {
         if (debug.mock.results[0].type === 'return') {
            return logger(name, debug.mock.results[0].value.logs);
         }

         return logger(name, {});
      }),
      {
         formatters: {
            H: 'hello-world',
         },
      }
   );

   return debug;
});

function logs(): Record<string, string[]> {
   return (require('debug') as jest.Mock).mock.results[0].value.logs;
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
