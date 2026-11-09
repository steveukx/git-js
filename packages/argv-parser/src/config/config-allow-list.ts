/**
 * Configuration keys that can be set from untrusted input without giving the caller a route
 * to run a program, read or write files of their choosing, redirect network traffic, or
 * weaken a security check built into `git`.
 *
 * Keys are matched case-insensitively; `*` matches any run of characters (including the `.`
 * that separates a subsection, so `color.*` matches both `color.ui` and `color.diff.meta`).
 *
 * Before adding a key, check its documentation in `git help config` for every one of:
 * - is the value ever executed, or used to locate an executable or script?
 * - is the value a path to a file that `git` will read or write?
 * - does the value change which host / protocol / proxy `git` connects to?
 * - does the value turn off a safety check (`safe.directory`, `http.sslVerify`, fsck, ...)?
 * If the answer to any of these is "yes", or the key has a subsection that can name a
 * driver (`diff.<driver>.*`, `filter.<driver>.*`, ...), it does not belong here.
 */
export const SAFE_CONFIG_KEYS: readonly string[] = Object.freeze([
   // identity
   'user.name',
   'user.email',
   'user.useconfigonly',
   'author.name',
   'author.email',
   'committer.name',
   'committer.email',

   // line endings, file system and display behaviour
   'core.abbrev',
   'core.autocrlf',
   'core.bigfilethreshold',
   'core.commentchar',
   'core.commentstring',
   'core.compression',
   'core.eol',
   'core.filemode',
   'core.ignorecase',
   'core.logallrefupdates',
   'core.longpaths',
   'core.precomposeunicode',
   'core.preloadindex',
   'core.quotepath',
   'core.safecrlf',
   'core.untrackedcache',
   'core.whitespace',
   'advice.*',
   'color.*',
   'column.ui',
   'i18n.commitencoding',
   'i18n.logoutputencoding',
   'init.defaultbranch',

   // branch / merge / rebase / pull / push defaults
   'branch.autosetupmerge',
   'branch.autosetuprebase',
   'branch.sort',
   'checkout.defaultremote',
   'clone.defaultremotename',
   'fetch.prune',
   'fetch.prunetags',
   'merge.conflictstyle',
   'merge.ff',
   'merge.renamelimit',
   'pull.ff',
   'pull.rebase',
   'push.autosetupremote',
   'push.default',
   'push.followtags',
   'rebase.autosquash',
   'rebase.autostash',
   'rerere.enabled',
   'tag.sort',
   'versionsort.suffix',

   // output formatting of diff / log / status / grep
   'diff.algorithm',
   'diff.colormoved',
   'diff.context',
   'diff.interhunkcontext',
   'diff.mnemonicprefix',
   'diff.noprefix',
   'diff.relative',
   'diff.renamelimit',
   'diff.renames',
   'grep.extendedregexp',
   'grep.linenumber',
   'grep.patterntype',
   'log.abbrevcommit',
   'log.date',
   'log.decorate',
   'log.follow',
   'status.branch',
   'status.renames',
   'status.short',
   'status.showuntrackedfiles',

   // performance and transfer tuning
   'feature.manyfiles',
   'gc.auto',
   'gc.autodetach',
   'http.lowspeedlimit',
   'http.lowspeedtime',
   'http.postbuffer',
   'http.version',
   'index.version',
   'pack.threads',
   'pack.windowmemory',
   'protocol.version',

   // extra request headers, commonly used for CI authentication tokens
   'http.extraheader',
   'http.*.extraheader',

   // integrity checks - these only ever make git stricter
   'fetch.fsckobjects',
   'receive.fsckobjects',
   'transfer.fsckobjects',
]);

/**
 * Build a matcher for a set of configuration key patterns, see `SAFE_CONFIG_KEYS` for the
 * pattern format.
 */
export function configKeyMatcher(patterns: readonly string[]): (key: string) => boolean {
   const exact = new Set<string>();
   const wildcards: RegExp[] = [];

   for (const pattern of patterns) {
      const normalised = String(pattern).trim().toLowerCase();
      if (!normalised) {
         continue;
      }

      if (normalised.includes('*')) {
         wildcards.push(
            new RegExp(
               `^${normalised
                  .split('*')
                  .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
                  .join('.*')}$`
            )
         );
      } else {
         exact.add(normalised);
      }
   }

   return (key: string) => {
      const normalised = key.trim().toLowerCase();
      return exact.has(normalised) || wildcards.some((regex) => regex.test(normalised));
   };
}

/**
 * Whether the supplied configuration key is in the built-in list of keys that are safe to
 * use with untrusted values.
 */
export const isSafeConfigKey = configKeyMatcher(SAFE_CONFIG_KEYS);
