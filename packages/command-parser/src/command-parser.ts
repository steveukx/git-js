import {
   collectSwitches,
   COMMAND_OPTIONS,
   EMPTY_SPEC,
   normalizeCommandArgs,
   parseLeadingGlobals,
   asString,
} from './parse-args';
import { collectConfigValues, parseConfigTask } from './parse-config-args';
import {NormalizedCommandArgs, ParsedConfigTask, ParsedGitSwitch} from './parse-args.types';

export type { ParsedConfigTask, ParsedGitSwitch } from './parse-args.types';

export interface ParsedGitCommand extends NormalizedCommandArgs {
   command: string[];
   config: Record<string, string>;
   configCommand: ParsedConfigTask | null;
   configEnv: Record<string, string>;
   prefix: string[];
   switches: ParsedGitSwitch[];
   task: string | null;
}

export function commandParser(input: readonly unknown[]): ParsedGitCommand {
   const argv = [...input];
   const leading = parseLeadingGlobals(argv);
   const task = leading.taskIndex < argv.length ? asString(argv[leading.taskIndex]).toLowerCase() : null;
   const commandArgs = task === null ? [] : argv.slice(leading.taskIndex + 1);
   const commandSpec = task ? COMMAND_OPTIONS[task] || EMPTY_SPEC : EMPTY_SPEC;
   const commandScan = collectSwitches(commandArgs, 'command', commandSpec, leading.taskIndex + 1);
   const normalized = normalizeCommandArgs(commandArgs, commandScan.consumedIndices);
   const configCommand = parseConfigTask(task, normalized.args);
   const prefix = argv.slice(0, leading.taskIndex).map(asString);
   const command = task === null ? prefix : [...prefix, task, ...normalized.args];

   return {
      ...normalized,
      command,
      config: collectConfigValues(leading.switches, commandScan.switches, false),
      configCommand,
      configEnv: collectConfigValues(leading.switches, commandScan.switches, true),
      prefix,
      switches: [...leading.switches, ...commandScan.switches],
      task,
   };
}
