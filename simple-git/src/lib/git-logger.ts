import debug, { Debugger } from 'debug';
import {
   append,
   filterHasLength,
   filterString,
   filterType,
   NOOP,
   objectToString,
   remove,
} from './utils';
import { Maybe } from './types';

debug.formatters.L = (value: any) => String(filterHasLength(value) ? value.length : '-');
debug.formatters.B = (value: Buffer) => {
   if (Buffer.isBuffer(value)) {
      return value.toString('utf8');
   }
   return objectToString(value);
};

type OutputLoggingHandler = (message: string, ...args: any[]) => void;

function createLog() {
   return debug('simple-git');
}

export interface OutputLogger extends OutputLoggingHandler {
   readonly label: string;

   info: OutputLoggingHandler;
   step(nextStep?: string): OutputLogger;
   sibling(name: string): OutputLogger;
}

function prefixedLogger(
   to: Debugger,
   prefix: string,
   forward?: OutputLoggingHandler
): OutputLoggingHandler {
   if (!prefix || !String(prefix).replace(/\s*/, '')) {
      return !forward
         ? to
         : (message, ...args) => {
              to(message, ...args);
              forward(message, ...args);
           };
   }

   return (message, ...args) => {
      to(`%s ${message}`, prefix, ...args);
      if (forward) {
         forward(message, ...args);
      }
   };
}

function childLoggerName(
   name: Maybe<string>,
   childDebugger: Maybe<Debugger>,
   { namespace: parentNamespace }: Debugger
): string {
   if (typeof name === 'string') {
      return name;
   }
   const childNamespace = (childDebugger && childDebugger.namespace) || '';

   if (childNamespace.startsWith(parentNamespace)) {
      return childNamespace.substr(parentNamespace.length + 1);
   }

   return childNamespace || parentNamespace;
}

export function createLogger(
   label: string,
   verbose?: string | Debugger,
   initialStep?: string,
   infoDebugger = createLog()
): OutputLogger {
   const labelPrefix = (label && `[${label}]`) || '';

   const spawned: OutputLogger[] = [];
   const debugDebugger: Maybe<Debugger> =
      typeof verbose === 'string' ? infoDebugger.extend(verbose) : verbose;
   const key = childLoggerName(filterType(verbose, filterString), debugDebugger, infoDebugger);

   return step(initialStep);

   function sibling(name: string, initial?: string) {
      return append(
         spawned,
         createLogger(label, key.replace(/^[^:]+/, name), initial, infoDebugger)
      );
   }

   function step(phase?: string) {
      const stepPrefix = (phase && `[${phase}]`) || '';
      const debug = (debugDebugger && prefixedLogger(debugDebugger, stepPrefix)) || NOOP;
      const info = prefixedLogger(infoDebugger, `${labelPrefix} ${stepPrefix}`, debug);

      return Object.assign(debugDebugger ? debug : info, {
         label,
         sibling,
         info,
         step,
      });
   }
}

/**
 * The `GitLogger` is used by the main `SimpleGit` runner to handle logging
 * any warnings or errors.
 */
export class GitLogger {
   public error: OutputLoggingHandler;

   public warn: OutputLoggingHandler;

   constructor(private _out: Debugger = createLog()) {
      this.error = prefixedLogger(_out, '[ERROR]');
      this.warn = prefixedLogger(_out, '[WARN]');
   }

   silent(silence = false) {
      if (silence !== this._out.enabled) {
         return;
      }

      const { namespace } = this._out;
      const env = (process.env.DEBUG || '').split(',').filter((s) => !!s);
      const hasOn = env.includes(namespace);
      const hasOff = env.includes(`-${namespace}`);

      // enabling the log
      if (!silence) {
         if (hasOff) {
            remove(env, `-${namespace}`);
         } else {
            env.push(namespace);
         }
      } else {
         if (hasOn) {
            remove(env, namespace);
         } else {
            env.push(`-${namespace}`);
         }
      }

      debug.enable(env.join(','));
   }
}
