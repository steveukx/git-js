import type { ParsedCLI } from './parse-cli.types';
import { parseTaskSwitches, parseGlobalSwitches } from './switches/parse-switches';
import { collectConfigAccess } from './config/analyse-config';

/**
 * Parse the tokens that would be forwarded to a `git` child-process and
 * return a structured summary of what the invocation does.
 */
export function parseCli(...tokens: readonly unknown[]): ParsedCLI {
   const { switches: globalSwitches, taskIndex } = parseGlobalSwitches(tokens);

   const task = taskIndex < tokens.length ? String(tokens[taskIndex]).toLowerCase() : null;
   const taskTokens = task !== null ? tokens.slice(taskIndex + 1) : [];

   const { switches: taskSwitches, positionals, pathspecs } = parseTaskSwitches(taskTokens, task);

   const allSwitches = [...globalSwitches, ...taskSwitches];

   return {
      task,
      switches: allSwitches.map((sw) =>
         sw.value !== undefined ? { switch: sw.name, value: sw.value } : { switch: sw.name }
      ),
      paths: pathspecs,
      ...collectConfigAccess(task, globalSwitches, taskSwitches, positionals),
   };
}
