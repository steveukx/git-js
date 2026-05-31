import { afterEach, vi } from 'vitest';
import { mockChildProcessModule } from '../__mocks__/mock-child-process';

vi.mock('child_process', () => mockChildProcessModule);
vi.mock('node:child_process', () => mockChildProcessModule);

vi.mock('debug', () => {
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
      vi.fn((name) => {
         if (debug.mock.results[0]?.type === 'return') {
            return logger(name, debug.mock.results[0].value.logs);
         }

         return logger(name, {});
      }),
      {
         enable() {},
         formatters: {
            H: 'hello-world',
         },
      }
   );

   return { default: debug };
});

vi.mock('@kwsites/file-exists', async (importOriginal) => ({
   ...(await importOriginal<typeof import('@kwsites/file-exists')>()),
   exists: vi.fn().mockReturnValue(true),
}));

afterEach(() => {
   mockChildProcessModule.$reset();
});
