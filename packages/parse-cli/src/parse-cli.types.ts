/** Where a config value originates / which scope it targets. */
export type ConfigScope =
   | 'inline' // runtime override via -c key=value (no file written)
   | 'env' // runtime override via --config-env=key=VAR
   | 'local' // .git/config (git's default when no scope flag is given)
   | 'global' // ~/.gitconfig
   | 'system' // /etc/gitconfig
   | 'worktree' // .git/config.worktree
   | 'file'; // explicit path via --file / -f

/** A single switch or option found in the token list. */
export interface ParsedCLISwitch {
   /** Canonical name: e.g. `'-m'`, `'--amend'`, `'--no-verify'`. */
   switch: string;
   /** Value consumed by this switch, when applicable. */
   value?: string;
}

/** A config key that this invocation writes. */
export interface ConfigWrite {
   /** Lower-cased dotted key, e.g. `'core.sshcommand'`. */
   key: string;
   scope: ConfigScope;
   /**
    * The value being written.
    * Absent for delete-style operations (`--unset`, `--remove-section`).
    * For `scope: 'env'` this is the environment-variable *name*, not the
    * resolved config value.
    */
   value?: string;
}

/** A config key that this invocation reads via `git config`. */
export interface ConfigRead {
   /** Lower-cased dotted key, e.g. `'user.name'`. */
   key: string;
   scope: ConfigScope;
}

/** Fully parsed representation of a git token list. */
export interface ParsedCLI {
   /**
    * The git sub-command, e.g. `'commit'`, `'push'`.
    * `null` when the list contains only global flags (`['--version']`, `[]`).
    */
   task: string | null;
   /**
    * Every flag and option in the tokens (global + command-level), with
    * combined short clusters expanded: `-uc` → `[{switch:'-u'}, {switch:'-c'}]`.
    */
   switches: ParsedCLISwitch[];
   /** File-system paths: tokens after `--`, or `pathspec()` wrapper objects. */
   paths: string[];
   /** Config keys written by this invocation (inline overrides and `git config` writes). */
   configWrites: ConfigWrite[];
   /** Config keys read by a `git config` read operation. */
   configReads: ConfigRead[];
}
