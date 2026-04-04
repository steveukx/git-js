// ── Option tables ─────────────────────────────────────────────────────────────
//
// Each scope has:
//   short  – Map<char, consumesNext>  (known single-letter switches; true = takes next token)
//   long   – Set<stem>                (long switch stems, without --, that take the next token)
//
// Only switches listed here are "known". An unknown char anywhere in a combined
// cluster causes the entire cluster to be kept as one opaque token.

export interface FlagSpec {
   readonly short: ReadonlyMap<string, boolean>;
   readonly long: ReadonlySet<string>;
}

export const GLOBAL: FlagSpec = {
   short: new Map([
      ['C', true], //  -C <path>   change working directory
      ['P', false], // -P          no pager (alias for --no-pager)
      ['c', true], //  -c <k=v>    set config key for this invocation
      ['h', false], // -h          help
      ['p', false], // -p          paginate
      ['v', false], // -v          version
   ]),
   long: new Set([
      'attr-source',
      'config-env',
      'exec-path',
      'git-dir',
      'list-cmds',
      'namespace',
      'super-prefix',
      'work-tree',
   ]),
};

const COMMANDS: Record<string, FlagSpec> = {
   clone: {
      short: new Map([
         ['b', true], // -b <branch>
         ['j', true], // -j <n>          parallel jobs
         ['l', false], // -l local
         ['n', false], // -n no-checkout
         ['o', true], // -o <name>       remote name
         ['q', false], // -q quiet
         ['s', false], // -s shared
         ['u', true], // -u <upload-pack>
      ]),
      long: new Set(['branch', 'config', 'jobs', 'origin', 'upload-pack']),
   },
   commit: {
      short: new Map([
         ['C', true], // -C <commit>  reuse message
         ['F', true], // -F <file>    read message from file
         ['c', true], // -c <commit>  reedit message
         ['m', true], // -m <msg>
         ['t', true], // -t <template>
      ]),
      long: new Set(['file', 'message', 'reedit-message', 'reuse-message', 'template']),
   },
   config: {
      short: new Map([
         ['e', false], // -e  open editor
         ['f', true], //  -f <file>
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

const EMPTY: FlagSpec = { short: new Map(), long: new Set() };

export function getFlagSpecForTask(task?: string | null) {
   return COMMANDS[task ?? ''] ?? EMPTY;
}
