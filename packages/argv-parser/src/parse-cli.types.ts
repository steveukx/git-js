/** Where a config value originates / which scope it targets. */
export type ConfigScope =
   | 'inline' // runtime override via -c key=value (no file written)
   | 'env' // runtime override via --config-env=key=VAR
   | 'local' // .git/config (git's default when no scope flag is given)
   | 'global' // ~/.gitconfig
   | 'system' // /etc/gitconfig
   | 'worktree' // .git/config.worktree
   | 'file'; // explicit path via --file / -f

/** A single flag or option found in the token list. */
export interface ParsedFlag {
   /** Canonical name: e.g. `'-m'`, `'--amend'`, `'--no-verify'`. */
   name: string;
   /** Value consumed by this flag, when applicable. */
   value?: string;
}

/** A config key that this invocation reads via `git config`. */
export interface ConfigRead {
   /** Lower-cased dotted key, e.g. `'user.name'`. */
   key: string;
   scope: ConfigScope;
}

/** A config key that this invocation writes. */
export interface ConfigWrite extends ConfigRead {
   /**
    * The value being written.
    * Absent for delete-style operations (`--unset`, `--remove-section`).
    * For `scope: 'env'` this is the environment-variable *name*, not the
    * resolved config value.
    */
   value?: string;
}

export interface ParsedConfigActivity {
   /** Config keys read by a `git config` read operation. */
   read: ConfigRead[];
   /** Config keys written by this invocation (inline overrides and `git config` writes). */
   write: ConfigWrite[];
}

/**
 * Fully parsed representation of a set of varargs to be passed into the `git` child process.
 */
export interface ParsedArgv {
   /**
    * The git sub-command, e.g. `'commit'`, `'push'`.
    * `null` when the list contains only global flags (`['--version']`, `[]`).
    */
   task: string | null;

   /**
    * Every flag and option in the tokens (global + command-level), with
    * combined short clusters expanded: `-uc` → `[{name:'-u'}, {name:'-c'}]`.
    */
   flags: ParsedFlag[];

   /**
    * File-system paths: tokens after `--`, or `pathspec()` wrapper objects.
    * */
   paths: string[];

   /**
    * Activities being requested for the `git` config
    */
   config: ParsedConfigActivity;
}
