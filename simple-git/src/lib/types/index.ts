import type { SpawnOptions } from 'child_process';

import type { VulnerabilityCategoryFlags } from '@simple-git/argv-parser';

import type { SimpleGitProgressEvent } from './handlers';
import type { SimpleGitTask } from './tasks';

export * from './handlers';
export * from './tasks';

/**
 * Where a task accepts custom options (eg: `pull` or `commit`), these can be supplied either as an
 * array of strings or as an {@link Options} object, the content of which is merged into the
 * command as trailing arguments.
 *
 * Unless the task is explicitly documented as such, tasks will not accept both formats at the
 * same time, preferring whichever appears last in the arguments.
 *
 * ### Options as an array
 *
 * Each string in the array is added to the command as-is:
 *
 * ```typescript
 * // results in 'git pull origin main --no-rebase'
 * await git.pull('origin', 'main', ['--no-rebase']);
 * ```
 *
 * ### Options as an object
 *
 * When the value of a property is a `string`, that name/value pair is added to the command as
 * `name=value`, when the value is `null` just the name is added:
 *
 * ```typescript
 * // results in 'git pull origin main --no-rebase'
 * await git.pull('origin', 'main', { '--no-rebase': null });
 *
 * // results in 'git pull origin main --rebase=true'
 * await git.pull('origin', 'main', { '--rebase': 'true' });
 * ```
 *
 * When the value of the property is an array of `string`s or `number`s, each element is added
 * as a separate `name=value` pair:
 *
 * ```typescript
 * // results in 'git log --grep=bug --grep=fix --grep=feature'
 * await git.log({ '--grep': ['bug', 'fix', 'feature'] });
 * ```
 *
 * ### Limiting the scope of a task
 *
 * When a task doesn't explicitly limit its scope (ie: `git.add()` requires the files to add, but
 * `git.status()` runs against the entire repo), add a {@link pathspec} to the options:
 *
 * ```typescript
 * import { pathspec } from 'simple-git';
 *
 * const fromArray = await git.status([pathspec('sub-dir')]);
 * const fromObject = await git.status({ 'sub-dir': pathspec('sub-dir') });
 * ```
 *
 * ### Trusted content
 *
 * Options are always treated as trusted - write them in your application and use untrusted data
 * only to choose between them, never to build them. Use {@link SimpleGitBase.cmd | git.cmd} when
 * a command needs to include untrusted data.
 *
 * ```typescript
 * // the request decides whether to force push, but never supplies the options themselves
 * const options = request.force ? { '--force-with-lease': null } : {};
 * await git.push('origin', 'main', options);
 * ```
 */
export type TaskOptions<O extends Options = Options> = string[] | O;

/**
 * Values permitted in an {@link Options} object.
 */
export type OptionsValues = null | string | number | (string | number)[];

/**
 * Options supplied in most tasks as an optional trailing object, see {@link TaskOptions} for how
 * each property is converted into command arguments.
 */
export type Options = Record<string, OptionsValues>;

export type OptionFlags<FLAGS extends string, VALUE = null> = Partial<Record<FLAGS, VALUE>>;

/**
 * A function called by the executor immediately after creating a child
 * process. Allows the calling application to implement custom handling of
 * the incoming stream of data from the `git`.
 */
export type outputHandler = (
   command: string,
   stdout: NodeJS.ReadableStream,
   stderr: NodeJS.ReadableStream,
   args: string[]
) => void;

/**
 * Environment variables to be passed into the child process.
 */
export type GitExecutorEnv = NodeJS.ProcessEnv | undefined;

/**
 * Public interface of the Executor
 */
export interface SimpleGitExecutor {
   env: GitExecutorEnv;
   outputHandler?: outputHandler;
   cwd: string;

   chain(): SimpleGitExecutor;

   push<R>(task: SimpleGitTask<R>): Promise<R>;
}

/**
 * The resulting output from running the git child process
 */
export interface GitExecutorResult {
   stdOut: Buffer[];
   stdErr: Buffer[];
   exitCode: number;
   rejection: Maybe<Error>;
}

export interface SimpleGitPluginConfig {
   abort: AbortSignal;

   /**
    * Environment variables in the guarded `GitEnvKeys` set (every `GIT_`-prefixed
    * key plus known-vulnerable non-prefixed keys such as `EDITOR` / `PAGER`) are
    * removed from the child process environment unless named here. A guarded key
    * supplied explicitly through `.env()` and not named here rejects the task it
    * is used with; guarded keys inherited from the ambient environment are
    * stripped and logged to the `debug` output.
    *
    * Naming a key here also permits it past the unsafe-operations check (for example
    * `GIT_SSH_COMMAND` no longer also needs `unsafe.allowUnsafeSshCommand`), with the
    * exception of `GIT_CONFIG_PARAMETERS` which still needs `unsafe.allowUnsafeConfigEnvCount`
    * because its content cannot be checked against `allowConfig`.
    */
   allowEnvironment: readonly string[];

   /**
    * Configuration keys that may be set by tasks run through this instance, whether through
    * the `config` option, `-c` / `--config-env` arguments, `git config` writes or the
    * `GIT_CONFIG_KEY_<n>` environment variables.
    *
    * A built-in list of keys that cannot be used to run programs, load files, redirect
    * network traffic or turn off `git` safety checks is always allowed (see the
    * `SAFE_CONFIG_KEYS` export of `@simple-git/argv-parser`). Use this option to allow any
    * other key; patterns are case-insensitive and `*` matches any characters, for example:
    *
    * ```typescript
    * simpleGit({ allowConfig: ['core.sshCommand', 'http.proxy', 'filter.lfs.*'] });
    * ```
    *
    * Keys named here are permitted even when they are also covered by one of the
    * `unsafe.allowUnsafe*` categories.
    */
   allowConfig: readonly string[];

   /**
    * By default a configuration key that is neither in the built-in safe list nor in
    * `allowConfig` (nor covered by an enabled `unsafe.allowUnsafe*` option) emits a one-off
    * process warning. Set `strictConfig: true` to reject the task instead - this will become
    * the default behaviour in the next major version.
    */
   strictConfig: boolean;

   /**
    * Name of the binary the child processes will spawn - defaults to `git`,
    * supply as a tuple to enable the use of platforms that require `git` to be
    * called through an alternative binary (eg: `wsl git ...`).
    * Note: commands supplied in this way support a restricted set of characters
    * and should not be used as a way to supply arbitrary config arguments etc.
    */
   binary: string | [string] | [string, string];

   /**
    * Configures the events that should be used to determine when the unederlying child process has
    * been terminated.
    *
    * Version 2 will default to use `onClose=true, onExit=50` to mean the `close` event will be
    * used to immediately treat the child process as closed and start using the data from `stdOut`
    * / `stdErr`, whereas the `exit` event will wait `50ms` before treating the child process
    * as closed.
    *
    * This will be changed in version 3 to use `onClose=true, onExit=false` so that only the
    * close event is used to determine the termination of the process.
    */
   completion: {
      onClose?: boolean | number;
      onExit?: boolean | number;
   };

   /**
    * Configures the content of errors thrown by the `simple-git` instance for each task
    */
   errors(
      error: Buffer | Error | undefined,
      result: Omit<GitExecutorResult, 'rejection'>
   ): Buffer | Error | undefined;

   input(commands: readonly string[]): Buffer | string | undefined;

   /**
    * Handler to be called with progress events emitted through the progress plugin
    */
   progress(data: SimpleGitProgressEvent): void;

   /**
    * Configuration for the `timeoutPlugin`
    */
   timeout: {
      /**
       * The number of milliseconds to wait after spawning the process / receiving
       * content on the stdOut/stdErr streams before forcibly closing the git process.
       */
      block: number;

      /**
       * Reset timeout plugin after receiving data on `stdErr` - set to `false` to ignore
       * `stdErr` content when determining whether to kill the process (defaults to `true`).
       */
      stdErr?: boolean;

      /**
       * Reset timeout plugin after receiving data on `stdOut` - set to `false` to ignore
       * `stdOut` content when determining whether to kill the process (defaults to `true`).
       */
      stdOut?: boolean;
   };

   spawnOptions: Pick<SpawnOptions, 'uid' | 'gid'>;

   unsafe: Partial<
      VulnerabilityCategoryFlags & {
         /**
          * Allows potentially unsafe values to be supplied in the `binary` configuration option and
          * `git.customBinary()` method call.
          */
         allowUnsafeCustomBinary: boolean;

         /**
          * Allows the use of abbreviated long-form options in `git` commands.
          * Enabling this option is only safe in environments where data supplied to `simple-git` is always sanitised
          * as it can be a route to bypassing vulnerability checks.
          */
         allowAbbreviatedOptions: boolean;
      }
   >;
}

/**
 * Optional configuration settings to be passed to the {@link simpleGit} factory function.
 *
 * ```typescript
 * const git = simpleGit({
 *    baseDir: process.cwd(),
 *    binary: 'git',
 *    maxConcurrentProcesses: 6,
 *    trimmed: false,
 * });
 * ```
 */
export interface SimpleGitOptions extends Partial<SimpleGitPluginConfig> {
   /**
    * Base directory for all tasks run through this `simple-git` instance
    */
   baseDir: string;
   /**
    * Limit for the number of child processes that will be spawned concurrently from a `simple-git`
    * instance, pending tasks are queued until a process is available (defaults to `5`).
    */
   maxConcurrentProcesses: number;
   /**
    * Per-command configuration parameters to be passed with the `-c` switch to `git`, these
    * are not saved in the git config.
    *
    * ```typescript
    * const git = simpleGit({ config: ['http.proxy=someproxy'] });
    *
    * // runs: git -c http.proxy=someproxy pull
    * await git.pull();
    * ```
    *
    * Keys outside the built-in safe list must also be named in {@link allowConfig}.
    */
   config: string[];
   /**
    * Enable trimming of trailing white-space in `git.raw`
    */
   trimmed: boolean;
}

export type Maybe<T> = T | undefined;
export type MaybeArray<T> = T | T[];

export type Primitives = string | number | boolean;
