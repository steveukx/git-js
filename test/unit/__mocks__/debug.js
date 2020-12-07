const output = new Map();

let enabled = true;
let debugEnv = process.env.DEBUG;
const enable = jest.fn();
const disable = jest.fn();

const debug = module.exports = function (namespace) {
   const logged = output.get(namespace) || {
      get count () {
         return this.messages.length;
      },
      messages: [],
      toString () {
         return this.messages.join('\n');
      }
   };
   output.set(namespace, logged);

   return Object.defineProperties(
      (format, ...data) => {
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
            value (name) {
               return debug(`${ namespace }:${ name }`);
            }
         },
         enabled: {
            get () {
               return enabled;
            }
         },
         namespace: { value: namespace }
      });
};

Object.defineProperties(debug, {
   __esModule: { value: true },
   default: { value: debug },
});

Object.assign(debug, {
   enable,
   disable,
   formatters: {},

   $debugEnvironmentVariable (debugEnv = '*') {
      process.env.DEBUG = debugEnv;
   },
   $enabled (_enabled = true) {
      enabled = _enabled;
   },
   $logged (...matching) {
      return Array.from(output.entries())
         .filter(([namespace]) => {
            return !matching.length || matching.some(regex => regex.test(namespace));
         })
         .reduce((all, [namespace, logged]) => {
         all[namespace] = logged;
         return all;
      }, {});
   },
});

afterEach(() => {
   process.env.DEBUG = debugEnv;
   enabled = true;
   output.clear();
   enable.mockReset();
   disable.mockReset();

   const queue = require('../../../src/lib/runners/tasks-pending-queue');
   queue.TasksPendingQueue.counter = 0;
});
