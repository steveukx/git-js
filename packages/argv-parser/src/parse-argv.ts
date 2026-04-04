import type { ParsedArgv, ParsedFlag } from './parse-cli.types';
import { parseGlobalFlags } from './flags/parse-global-flags';
import { collectConfigAccess } from './config/analyse-config';
import { parseTaskFlags } from './flags/parse-task-flags';
import { Flag } from './flags/flags.helpers';

/**
 * Parse the tokens that would be forwarded to a `git` child-process and
 * return a structured summary of what the invocation does.
 */
export function parseArgv(...tokens: readonly unknown[]): ParsedArgv {
   const { flags, taskIndex } = parseGlobalFlags(tokens);

   const task = taskIndex < tokens.length ? String(tokens[taskIndex]).toLowerCase() : null;
   const taskTokens = task !== null ? tokens.slice(taskIndex + 1) : [];

   const { positionals, pathspecs } = parseTaskFlags(taskTokens, task, flags);

   return {
      task,
      flags: flags.map(toParsedFlag),
      paths: pathspecs,
      config: collectConfigAccess(task, flags, positionals),
   };
}

function toParsedFlag({ value, name }: Flag): ParsedFlag {
   return value !== undefined ? { name, value } : { name };
}
