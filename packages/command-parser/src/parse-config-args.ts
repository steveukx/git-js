import {asString, collectSwitches, COMMAND_OPTIONS, isSwitchToken} from './parse-args';
import {type ParsedConfigTask, type ParsedGitSwitch} from './parse-args.types';

const CONFIG_WRITE_FLAGS = new Map<string, ParsedConfigTask['action']>([
   ['--add', 'set'],
   ['--edit', 'edit'],
   ['--remove-section', 'remove-section'],
   ['--rename-section', 'rename-section'],
   ['--replace-all', 'set'],
   ['--unset', 'unset'],
   ['--unset-all', 'unset'],
   ['-e', 'edit'],
]);

const CONFIG_READ_FLAGS = new Map<string, ParsedConfigTask['action']>([
   ['--get', 'get'],
   ['--get-all', 'get'],
   ['--get-color', 'get-color'],
   ['--get-colorbool', 'get-colorbool'],
   ['--get-regexp', 'get'],
   ['--get-urlmatch', 'get'],
   ['--list', 'list'],
   ['-l', 'list'],
]);

const CONFIG_ACTIONS = new Map<string, ParsedConfigTask>([
   ['edit', { action: 'edit', writes: true }],
   ['get', { action: 'get', writes: false }],
   ['get-color', { action: 'get-color', writes: false }],
   ['get-colorbool', { action: 'get-colorbool', writes: false }],
   ['list', { action: 'list', writes: false }],
   ['remove-section', { action: 'remove-section', writes: true }],
   ['rename-section', { action: 'rename-section', writes: true }],
   ['set', { action: 'set', writes: true }],
   ['unset', { action: 'unset', writes: true }],
]);

export function parseConfigTask(task: string | null, args: readonly string[]): ParsedConfigTask | null {
   if (task !== 'config') {
      return null;
   }

   const scan = collectSwitches(args, 'command', COMMAND_OPTIONS.config, 0);
   const positionals: string[] = [];

   for (const current of scan.switches) {
      const action = CONFIG_ACTIONS.get(current.name.replace(/^--/, ''));
      if (action) {
         return action;
      }

      const writeAction = CONFIG_WRITE_FLAGS.get(current.name);
      if (writeAction) {
         return { action: writeAction, writes: true };
      }

      const readAction = CONFIG_READ_FLAGS.get(current.name);
      if (readAction) {
         return { action: readAction, writes: false };
      }
   }

   for (let index = 0; index < args.length; index++) {
      if (scan.consumedIndices.has(index)) {
         continue;
      }

      const current = asString(args[index]).toLowerCase();
      if (current === '--') {
         break;
      }

      if (isSwitchToken(current)) {
         continue;
      }

      const action = CONFIG_ACTIONS.get(current);
      if (action) {
         return action;
      }

      positionals.push(current);
   }

   if (positionals.length >= 2) {
      return { action: 'set', writes: true };
   }

   if (positionals.length === 1) {
      return { action: 'get', writes: false };
   }

   return { action: 'unknown', writes: false };
}

// export function parseConfigArgs

export function collectConfigValues(
   globalSwitches: readonly ParsedGitSwitch[],
   commandSwitches: readonly ParsedGitSwitch[],
   env: boolean
) {
   const config: Record<string, string> = {};

   for (const current of [...globalSwitches, ...commandSwitches]) {
      if (!current.value) {
         continue;
      }

      if (env ? current.name !== '--config-env' : !isConfigSwitch(current)) {
         continue;
      }

      const assignment = parseAssignment(current.value);
      if (!assignment) {
         continue;
      }

      config[assignment.key] = assignment.value;
   }

   return config;
}

function parseAssignment(value: string) {
   const separator = value.indexOf('=');
   if (separator <= 0) {
      return null;
   }

   return {
      key: value.slice(0, separator).trim().toLowerCase(),
      value: value.slice(separator + 1),
   };
}

function isConfigSwitch(current: ParsedGitSwitch) {
   return current.name === '-c' || current.name === '--config';
}
