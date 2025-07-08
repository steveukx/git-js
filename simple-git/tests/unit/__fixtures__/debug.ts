import { Mock, vi } from 'vitest';

type MockDebugInstance = {
   (...args: unknown[]): void;
   extend(child: string): MockDebugInstance;
};
type MockDebug = {
   out: Mock;
   instances: Array<(...args: unknown[]) => void>;
   default: {
      (name: string): MockDebugInstance;
      formatters: {
         H: 'hello-world';
         [key: string]: string;
      };
   };
};

vi.doMock('debug', () => {
   const out = vi.fn();
   const instances: Array<(...args: unknown[]) => void> = [];

   function logger(name: string) {
      const log = (...args: unknown[]) => {
         out(name, ...args);
      };

      function extend(child: string) {
         return logger(`${name}:${child}`);
      }

      return (instances[instances.length] = Object.assign(log, {
         extend,
      }));
   }

   return {
      out,
      instances,
      default: Object.assign(logger, {
         formatters: {
            H: 'hello-world',
         },
      }),
   };
});

export async function $logReset() {
   const mod = (await import('debug')) as unknown as MockDebug;

   mod.instances.length = 0;
   mod.out.mockClear();
}

export async function $countLogsCreated() {
   const mod = (await import('debug')) as unknown as MockDebug;

   return mod.instances.length;
}

export async function $logNames(...matching: Array<RegExp | string>) {
   const mod = (await import('debug')) as unknown as MockDebug;

   return mod.out.mock.calls.filter(matches).map(([name]) => name);

   function matches(tokens: unknown[]) {
      if (!matching.length) return true;

      const line = tokens.join(' | ');
      for (const regex of matching) {
         if (typeof regex === 'string' ? line.includes(regex) : regex.test(line)) {
            return true;
         }
      }

      return false;
   }
}
