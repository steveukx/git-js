import { collectConfigAccess } from '../config/analyse-config';
import type { Flag } from '../flags/flags.helpers';
import { parseGlobalFlags } from '../flags/parse-global-flags';
import { parseTaskFlags } from '../flags/parse-task-flags';
import { vulnerabilityAnalysis } from '../vulnerabilities/vulnerability-analysis';
import type { ParsedArgv, ParsedFlag } from './parse-argv.types';

/**
 * Parse the tokens that would be forwarded to a `git` child-process and
 * return a structured summary of what the invocation does.
 */
export function parseArgv(...tokens: readonly unknown[]): ParsedArgv {
   const { flags, taskIndex } = parseGlobalFlags(tokens);

   const task = taskIndex < tokens.length ? String(tokens[taskIndex]).toLowerCase() : null;
   const taskTokens = task !== null ? tokens.slice(taskIndex + 1) : [];

   const { positionals, pathspecs } = parseTaskFlags(taskTokens, task, flags);
   const config = collectConfigAccess(task, flags, positionals);

   return {
      task,
      flags: flags.map(toParsedFlag),
      paths: pathspecs,
      config,
      vulnerabilities: vulnerabilityAnalysis(task, flags, config),
   };
}

function toParsedFlag({ value, name }: Flag): ParsedFlag {
   return value !== undefined ? { name, value } : { name };
}
