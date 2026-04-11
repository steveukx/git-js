import type { ConfigScope } from '../args/parse-argv.types';
import { type Flag, scopedFlags } from '../flags/flags.helpers';
import type { ConfigOperation } from './config.types';
import {
   CONFIG_READ_FLAGS,
   CONFIG_READ_VERBS,
   CONFIG_WRITE_FLAGS,
   CONFIG_WRITE_VERBS,
} from './config-operands';

export function detectConfigAction(flags: Flag[], positionals: string[]): ConfigOperation | null {
   for (const { name } of scopedFlags(flags, 'task')) {
      if (CONFIG_WRITE_FLAGS.has(name)) {
         return configOperation(true, positionals);
      }
      if (CONFIG_READ_FLAGS.has(name)) {
         return configOperation(false, positionals);
      }
   }

   const verb = positionals.at(0)?.toLowerCase();

   if (verb === undefined) {
      return null;
   }

   if (CONFIG_WRITE_VERBS.has(verb)) {
      return configOperation(true, positionals.slice(1));
   }

   if (CONFIG_READ_VERBS.has(verb)) {
      return configOperation(false, positionals.slice(1));
   }

   if (positionals.length === 1) {
      return configOperation(false, positionals);
   }

   return configOperation(true, positionals);
}

function configOperation(isWrite = false, positionals: string[] = []): ConfigOperation | null {
   const key = positionals.at(0)?.toLowerCase();

   if (key === undefined) {
      return null;
   }

   return {
      isWrite,
      isRead: !isWrite,
      key,
      value: positionals.at(1),
   };
}

export function toOperation(scope: ConfigScope, operation: ConfigOperation) {
   if (operation.isWrite && operation.value !== undefined) {
      return { key: operation.key, value: operation.value, scope };
   }
   return { key: operation.key, scope };
}
