import { commandParser } from '@simple-git/command-parser';
import type { ConfigRead, ConfigScope, ConfigWrite, ParsedCLI, ParsedCLISwitch } from './parse-cli.types';

export type { ConfigRead, ConfigScope, ConfigWrite, ParsedCLI, ParsedCLISwitch } from './parse-cli.types';

/**
 * The set of positional words that git config accepts as sub-command verbs
 * (introduced in git 2.43). When the first positional in a `git config`
 * invocation is one of these words it acts as the action selector rather than
 * being the config key.
 */
const CONFIG_SUBCOMMAND_VERBS = new Set([
   'edit',
   'get',
   'get-color',
   'get-colorbool',
   'list',
   'remove-section',
   'rename-section',
   'set',
   'unset',
]);

type CommandParserResult = ReturnType<typeof commandParser>;

/**
 * Parse an array of tokens that would be passed to a `git` child-process and
 * return a structured representation of the invocation.
 */
export function parseCLI(tokens: readonly unknown[]): ParsedCLI {
   const parsed = commandParser(tokens);

   return {
      task: parsed.task,
      switches: toSwitches(parsed),
      paths: parsed.pathspecs,
      ...collectConfigAccess(parsed),
   };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toSwitches(parsed: CommandParserResult): ParsedCLISwitch[] {
   return parsed.switches.map((s) =>
      s.value !== undefined ? { switch: s.name, value: s.value } : { switch: s.name }
   );
}

/**
 * Determine the config scope from the command-scoped switches.
 * Falls back to `'local'` (git's own default) when no scope flag is present.
 */
function detectConfigScope(parsed: CommandParserResult): ConfigScope {
   for (const s of parsed.switches) {
      if (s.kind !== 'command') continue;
      switch (s.name) {
         case '--global':
            return 'global';
         case '--system':
            return 'system';
         case '--worktree':
            return 'worktree';
         case '--local':
            return 'local';
         case '--file':
         case '-f':
            return 'file';
      }
   }
   return 'local';
}

/**
 * Extract the positional (non-switch, non-consumed-value) arguments from the
 * command arg list so that we can identify the config key and value.
 *
 * Strategy:
 * 1. Build a multiset of values consumed by command-scoped switches that
 *    absorbed the *next* token (i.e. the switch did not embed the value via
 *    `=`).  We consume each entry at most once so that an identical positional
 *    later in the list is not accidentally skipped.
 * 2. Walk `parsed.args`, skip switch tokens (`-…`) and consumed values.
 * 3. If the first remaining positional is a known config sub-command verb
 *    (e.g. `set`, `get`, `rename-section`) strip it – it is the action
 *    selector, not the config key.
 */
function extractConfigPositionals(parsed: CommandParserResult): string[] {
   // Build a count-map of values consumed by next-token absorption.
   const toConsume = new Map<string, number>();
   for (const sw of parsed.switches) {
      if (sw.kind === 'command' && sw.value !== undefined && !sw.raw.includes('=')) {
         toConsume.set(sw.value, (toConsume.get(sw.value) ?? 0) + 1);
      }
   }

   const positionals: string[] = [];

   for (const arg of parsed.args) {
      if (arg === '--') break;
      if (arg.startsWith('-')) continue;

      const remaining = toConsume.get(arg);
      if (remaining !== undefined) {
         if (remaining <= 1) {
            toConsume.delete(arg);
         } else {
            toConsume.set(arg, remaining - 1);
         }
         continue;
      }

      positionals.push(arg);
   }

   // Strip a leading sub-command verb when it matches the detected action.
   if (
      positionals.length > 0 &&
      CONFIG_SUBCOMMAND_VERBS.has(positionals[0].toLowerCase())
   ) {
      return positionals.slice(1);
   }

   return positionals;
}

function collectConfigAccess(parsed: CommandParserResult): {
   configWrites: ConfigWrite[];
   configReads: ConfigRead[];
} {
   const configWrites: ConfigWrite[] = [];
   const configReads: ConfigRead[] = [];

   // ── Inline runtime overrides via `-c key=value` / `--config key=value` ──
   for (const [key, value] of Object.entries(parsed.config)) {
      configWrites.push({ key, value, scope: 'inline' });
   }

   // ── Runtime overrides via `--config-env=key=ENV_VAR` ──
   // The stored value is the *environment variable name*, not the config value.
   for (const [key, value] of Object.entries(parsed.configEnv)) {
      configWrites.push({ key, value, scope: 'env' });
   }

   // ── `git config` sub-command ──
   if (parsed.task !== 'config' || parsed.configCommand === null) {
      return { configWrites, configReads };
   }

   const scope = detectConfigScope(parsed);
   const positionals = extractConfigPositionals(parsed);

   if (parsed.configCommand.writes) {
      if (positionals.length >= 1) {
         const key = positionals[0].toLowerCase();
         const value = positionals.length >= 2 ? positionals[1] : undefined;
         configWrites.push(value !== undefined ? { key, scope, value } : { key, scope });
      }
   } else if (
      parsed.configCommand.action === 'get' ||
      parsed.configCommand.action === 'get-color' ||
      parsed.configCommand.action === 'get-colorbool'
   ) {
      if (positionals.length >= 1) {
         configReads.push({ key: positionals[0].toLowerCase(), scope });
      }
   }
   // 'list'  – no single key to report
   // 'edit'  – opens editor, specific keys unknowable at parse time

   return { configWrites, configReads };
}