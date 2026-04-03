/**
 * Where a config value originates / the scope it is written to.
 *
 * - `'inline'`  – set at runtime via `-c key=value` (no persistent scope)
 * - `'env'`     – set at runtime via `--config-env=key=VAR` (value sourced from env variable)
 * - `'local'`   – repository-local `.git/config` (default for `git config`)
 * - `'global'`  – user-level config (`~/.gitconfig` / `--global`)
 * - `'system'`  – system-level config (`/etc/gitconfig` / `--system`)
 * - `'worktree'`– worktree-level config (`--worktree`)
 * - `'file'`    – explicit file path (`--file <path>` / `-f <path>`)
 */
export type ConfigScope = 'inline' | 'env' | 'local' | 'global' | 'system' | 'worktree' | 'file';

/** A single flag or option found in the token list. */
export interface ParsedCLISwitch {
   /** The canonical switch name, e.g. `'-m'`, `'--amend'`, `'--no-verify'`. */
   switch: string;
   /** The value consumed by this switch, if any. */
   value?: string;
}

/** A git configuration key that is being written. */
export interface ConfigWrite {
   /** Lower-cased config key, e.g. `'core.sshcommand'`. */
   key: string;
   /** Scope the write targets. */
   scope: ConfigScope;
   /**
    * The value being written.
    * Absent for operations that delete or modify without a new value
    * (e.g. `--unset`, `--remove-section`), and for `--config-env` where
    * `value` is the *environment variable name* rather than the config value.
    */
   value?: string;
}

/** A git configuration key that is being read. */
export interface ConfigRead {
   /** Lower-cased config key, e.g. `'user.name'`. */
   key: string;
   /** Scope the read targets. */
   scope: ConfigScope;
}

/** The fully parsed representation of a git CLI token list. */
export interface ParsedCLI {
   /**
    * The git sub-command that will run, e.g. `'commit'`, `'push'`.
    * `null` when the token list contains no positional sub-command
    * (e.g. `['--version']`).
    */
   task: string | null;

   /**
    * Every switch and option found in the tokens (both global flags that
    * appear before the task and command-specific ones that follow it).
    * Combined clusters like `-uc` are expanded to individual entries.
    */
   switches: ParsedCLISwitch[];

   /**
    * File-system paths: tokens that appear after a `--` separator, or
    * values wrapped in a `pathspec()` helper from `@simple-git/command-parser`.
    */
   paths: string[];

   /**
    * Every git config key that will be written by this invocation, including
    * inline runtime overrides (`-c`) and `git config` write operations.
    */
   configWrites: ConfigWrite[];

   /**
    * Every git config key that will be read by a `git config` read operation.
    * Does not include implicit reads performed by every git command internally.
    */
   configReads: ConfigRead[];
}