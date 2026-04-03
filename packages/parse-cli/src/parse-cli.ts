import { isPathSpec, toPaths } from './pathspec';
import type { ConfigRead, ConfigScope, ConfigWrite, ParsedCLI } from './parse-cli.types';

// ── Option tables ─────────────────────────────────────────────────────────────
//
// Each scope has:
//   short  – Map<char, consumesNext>  (known single-letter switches; true = takes next token)
//   long   – Set<stem>                (long switch stems, without --, that take the next token)
//
// Only switches listed here are "known". An unknown char anywhere in a combined
// cluster causes the entire cluster to be kept as one opaque token.

interface SwitchSpec {
   readonly short: ReadonlyMap<string, boolean>;
   readonly long: ReadonlySet<string>;
}

const GLOBAL: SwitchSpec = {
   short: new Map([
      ['C', true],  // -C <path>   change working directory
      ['P', false], // -P          no pager (alias for --no-pager)
      ['c', true],  // -c <k=v>   set config key for this invocation
      ['h', false], // -h          help
      ['p', false], // -p          paginate
      ['v', false], // -v          version
   ]),
   long: new Set([
      'attr-source', 'config-env', 'exec-path', 'git-dir',
      'list-cmds', 'namespace', 'super-prefix', 'work-tree',
   ]),
};

const COMMANDS: Record<string, SwitchSpec> = {
   clone: {
      short: new Map([
         ['b', true],  // -b <branch>
         ['c', true],  // -c <k=v>
         ['j', true],  // -j <n>  parallel jobs
         ['o', true],  // -o <name>  remote name
         ['u', true],  // -u <upload-pack>
      ]),
      long: new Set(['branch', 'config', 'jobs', 'origin', 'upload-pack']),
   },
   commit: {
      short: new Map([
         ['C', true],  // -C <commit>  reuse message
         ['F', true],  // -F <file>    read message from file
         ['c', true],  // -c <commit>  reedit message
         ['m', true],  // -m <msg>
         ['t', true],  // -t <template>
      ]),
      long: new Set(['file', 'message', 'reedit-message', 'reuse-message', 'template']),
   },
   config: {
      short: new Map([
         ['e', false], // -e  open editor
         ['f', true],  // -f <file>
         ['l', false], // -l  list
      ]),
      long: new Set(['blob', 'comment', 'default', 'file', 'type', 'value']),
   },
   fetch: {
      short: new Map(),
      long: new Set(['upload-pack']),
   },
   pull: {
      short: new Map(),
      long: new Set(['upload-pack']),
   },
   push: {
      short: new Map(),
      long: new Set(['exec', 'receive-pack']),
   },
};

const EMPTY: SwitchSpec = { short: new Map(), long: new Set() };

// ── Internal representation ───────────────────────────────────────────────────

interface InternalSwitch {
   name: string;
   value?: string;
   /** Value came from the next token rather than being embedded after `=`. */
   absorbedNext: boolean;
   /** Switch appeared before the git sub-command. */
   isGlobal: boolean;
}

// ── Token-level parsing ───────────────────────────────────────────────────────

/** Parse a single raw token (e.g. `'-m'`, `'--amend'`, `'-uc'`) into one or
 *  more switch descriptors.  Values are not yet resolved for needsNext=true. */
function expandToken(raw: string, spec: SwitchSpec): Array<{ name: string; value?: string; needsNext: boolean }> {
   if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq > 2) {
         return [{ name: raw.slice(0, eq), value: raw.slice(eq + 1), needsNext: false }];
      }
      const stem = raw.slice(2);
      return [{ name: raw, needsNext: spec.long.has(stem) }];
   }

   // Single short switch
   if (raw.length === 2) {
      const char = raw.charAt(1);
      const consumes = spec.short.get(char);
      return [{ name: raw, needsNext: consumes === true }];
   }

   // Combined short cluster: try to expand char-by-char
   return expandCluster(raw, spec.short);
}

function expandCluster(
   raw: string,
   shortSpec: ReadonlyMap<string, boolean>
): Array<{ name: string; value?: string; needsNext: boolean }> {
   const chars = raw.slice(1).split('');
   const result: Array<{ name: string; value?: string; needsNext: boolean }> = [];

   for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const consumes = shortSpec.get(char);

      if (consumes === undefined) {
         // Unknown char: keep the whole raw token as opaque
         return [{ name: raw, needsNext: false }];
      }

      if (consumes) {
         const remainder = chars.slice(i + 1).join('');
         if (remainder) {
            const remainderAllKnown = [...remainder].every((c) => shortSpec.has(c));
            if (!remainderAllKnown) {
               // Remaining chars are the embedded value, not separate flags
               result.push({ name: `-${char}`, value: remainder, needsNext: false });
               return result;
            }
         }
      }

      result.push({ name: `-${char}`, needsNext: consumes });
   }

   return result;
}

// ── Phase 1: global switches (before the sub-command) ────────────────────────

function parseGlobal(tokens: readonly unknown[]): {
   switches: InternalSwitch[];
   taskIndex: number;
} {
   const switches: InternalSwitch[] = [];
   let i = 0;

   while (i < tokens.length) {
      const raw = String(tokens[i]);
      if (!raw.startsWith('-') || raw.length < 2) break;

      const parsed = expandToken(raw, GLOBAL);
      let next = i + 1;

      for (const t of parsed) {
         const sw: InternalSwitch = { name: t.name, value: t.value, absorbedNext: false, isGlobal: true };
         if (t.needsNext && sw.value === undefined && next < tokens.length) {
            sw.value = String(tokens[next]);
            sw.absorbedNext = true;
            next++;
         }
         switches.push(sw);
      }

      i = next;
   }

   return { switches, taskIndex: i };
}

// ── Phase 2: command tokens (after the sub-command) ──────────────────────────

function parseCommand(tokens: readonly unknown[], task: string | null): {
   switches: InternalSwitch[];
   positionals: string[];
   pathspecs: string[];
} {
   const spec = task != null ? (COMMANDS[task] ?? EMPTY) : EMPTY;
   const switches: InternalSwitch[] = [];
   const positionals: string[] = [];
   const pathspecs: string[] = [];

   let i = 0;
   while (i < tokens.length) {
      const current = tokens[i];

      if (isPathSpec(current)) {
         pathspecs.push(...toPaths(current as string));
         i++;
         continue;
      }

      const raw = String(current);

      if (raw === '--') {
         for (let j = i + 1; j < tokens.length; j++) {
            const t = tokens[j];
            isPathSpec(t) ? pathspecs.push(...toPaths(t as string)) : pathspecs.push(String(t));
         }
         break;
      }

      if (!raw.startsWith('-') || raw.length < 2) {
         positionals.push(raw);
         i++;
         continue;
      }

      const parsed = expandToken(raw, spec);
      let next = i + 1;

      for (const t of parsed) {
         const sw: InternalSwitch = { name: t.name, value: t.value, absorbedNext: false, isGlobal: false };
         if (t.needsNext && sw.value === undefined && next < tokens.length && !isPathSpec(tokens[next])) {
            sw.value = String(tokens[next]);
            sw.absorbedNext = true;
            next++;
         }
         switches.push(sw);
      }

      i = next;
   }

   return { switches, positionals, pathspecs };
}

// ── Config analysis ───────────────────────────────────────────────────────────

// Flags that unambiguously signal a write operation on git config.
const CONFIG_WRITE_FLAGS = new Set([
   '--add', '--edit', '--remove-section', '--rename-section',
   '--replace-all', '--unset', '--unset-all', '-e',
]);

// Flags that unambiguously signal a read operation.
const CONFIG_READ_FLAGS = new Set([
   '--get', '--get-all', '--get-color', '--get-colorbool',
   '--get-regexp', '--get-urlmatch', '--list', '-l',
]);

// Sub-command verbs accepted as the first positional by newer git versions.
const CONFIG_WRITE_VERBS = new Set(['edit', 'remove-section', 'rename-section', 'set', 'unset']);
const CONFIG_READ_VERBS  = new Set(['get', 'get-color', 'get-colorbool', 'list']);

function parseAssignment(raw: string | undefined): { key: string; value: string } | null {
   if (raw == null) return null;
   const eq = raw.indexOf('=');
   if (eq <= 0) return null;
   return { key: raw.slice(0, eq).trim().toLowerCase(), value: raw.slice(eq + 1) };
}

function detectScope(commandSwitches: InternalSwitch[]): ConfigScope {
   for (const sw of commandSwitches) {
      switch (sw.name) {
         case '--global':   return 'global';
         case '--system':   return 'system';
         case '--worktree': return 'worktree';
         case '--local':    return 'local';
         case '--file':
         case '-f':         return 'file';
      }
   }
   return 'local';
}

function detectConfigAction(
   commandSwitches: InternalSwitch[],
   positionals: string[]
): { isWrite: boolean; isRead: boolean; positionals: string[] } {
   for (const sw of commandSwitches) {
      if (CONFIG_WRITE_FLAGS.has(sw.name)) return { isWrite: true, isRead: false, positionals };
      if (CONFIG_READ_FLAGS.has(sw.name))  return { isWrite: false, isRead: true, positionals };
   }

   if (positionals.length > 0) {
      const verb = positionals[0].toLowerCase();
      if (CONFIG_WRITE_VERBS.has(verb)) return { isWrite: true,  isRead: false, positionals: positionals.slice(1) };
      if (CONFIG_READ_VERBS.has(verb))  return { isWrite: false, isRead: true,  positionals: positionals.slice(1) };
   }

   if (positionals.length >= 2) return { isWrite: true,  isRead: false, positionals };
   if (positionals.length === 1) return { isWrite: false, isRead: true,  positionals };
   return { isWrite: false, isRead: false, positionals };
}

function collectConfigAccess(
   task: string | null,
   allSwitches: InternalSwitch[],
   positionals: string[]
): { configWrites: ConfigWrite[]; configReads: ConfigRead[] } {
   const configWrites: ConfigWrite[] = [];
   const configReads: ConfigRead[]   = [];

   // Inline runtime overrides: -c key=value and --config key=value (any task)
   // Environment-variable overrides: --config-env=key=VAR_NAME
   for (const sw of allSwitches) {
      if (sw.name === '-c' || sw.name === '--config') {
         const a = parseAssignment(sw.value);
         if (a) configWrites.push({ key: a.key, value: a.value, scope: 'inline' });
      } else if (sw.name === '--config-env') {
         const a = parseAssignment(sw.value);
         if (a) configWrites.push({ key: a.key, value: a.value, scope: 'env' });
      }
   }

   if (task !== 'config') return { configWrites, configReads };

   const commandSwitches = allSwitches.filter((sw) => !sw.isGlobal);
   const scope = detectScope(commandSwitches);
   const action = detectConfigAction(commandSwitches, positionals);

   if (action.isWrite && action.positionals.length >= 1) {
      const key   = action.positionals[0].toLowerCase();
      const value = action.positionals.length >= 2 ? action.positionals[1] : undefined;
      configWrites.push(value !== undefined ? { key, scope, value } : { key, scope });
   } else if (action.isRead && action.positionals.length >= 1) {
      configReads.push({ key: action.positionals[0].toLowerCase(), scope });
   }

   return { configWrites, configReads };
}

// ── Public API ────────────────────────────────────────────────────────────────

export type { ConfigRead, ConfigScope, ConfigWrite, ParsedCLI } from './parse-cli.types';

/**
 * Parse the tokens that would be forwarded to a `git` child-process and
 * return a structured summary of what the invocation does.
 */
export function parseCli(...tokens: readonly unknown[]): ParsedCLI {
   const { switches: globalSwitches, taskIndex } = parseGlobal(tokens);

   const task = taskIndex < tokens.length ? String(tokens[taskIndex]).toLowerCase() : null;
   const commandTokens = task !== null ? tokens.slice(taskIndex + 1) : [];

   const { switches: commandSwitches, positionals, pathspecs } = parseCommand(commandTokens, task);

   const allSwitches = [...globalSwitches, ...commandSwitches];

   return {
      task,
      switches: allSwitches.map((sw) =>
         sw.value !== undefined ? { switch: sw.name, value: sw.value } : { switch: sw.name }
      ),
      paths: pathspecs,
      ...collectConfigAccess(task, allSwitches, positionals),
   };
}
