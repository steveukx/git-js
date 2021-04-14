interface ILogged extends Object {
   readonly count: number;
   messages: string[];
}

const output = new Map<string, ILogged>();

let enabled = true;
let debugEnv = process.env.DEBUG;

const defaultExport = jest.fn(debug);
export default defaultExport;

export const $disable = jest.fn();
export const $enable = jest.fn();

export function $debugEnvironmentVariable(debugEnv = '*') {
   process.env.DEBUG = debugEnv;
}

export function $enabled(_enabled = true) {
   enabled = _enabled;
}

export function $logNames(...matching: RegExp[]) {
   return Array.from(output.keys())
      .filter((namespace) => {
         return !matching.length || matching.some(regex => regex.test(namespace));
      });
}

export function $logMessagesFor(name: string) {
   return output.get(name)?.messages.join('\n');
}

function debug(namespace: string) {
   const logged: ILogged = output.get(namespace) || {
      get count() {
         return this.messages.length;
      },
      messages: [],
      toString() {
         return this.messages.join('\n');
      }
   };
   output.set(namespace, logged);

   return Object.defineProperties(
      (format: string, ...data: any[]) => {
         let message = format;
         for (let i = 0; i < data.length; i++) {
            if (typeof data[i] !== 'string' && !Buffer.isBuffer(data[i])) {
               break;
            }
            message += ' ' + data[i];
         }
         logged.messages.push(message);
      }, {
         extend: {
            value(name: string) {
               return debug(`${namespace}:${name}`);
            }
         },
         enabled: {
            get() {
               return enabled;
            }
         },
         namespace: {value: namespace}
      });
}

function api<T extends (...args: any[]) => unknown>(...targets: T[]) {
   targets.forEach(target => Object.assign(target, {
      enable: $enable,
      disable: $disable,
      formatters: {},
   }));
}

api(debug, defaultExport);

afterEach(() => {
   process.env.DEBUG = debugEnv;
   enabled = true;
   output.clear();
   $enable.mockReset();
   $disable.mockReset();
   defaultExport.mockClear();

   const queue = require('../../../src/lib/runners/tasks-pending-queue');
   queue.TasksPendingQueue.counter = 0;
});
