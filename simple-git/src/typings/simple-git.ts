import type { TemplateArgvValue } from '@simple-git/argv-parser';

import type { GitError } from '../lib/errors/git-error';
import type { RemoteWithoutRefs, RemoteWithRefs } from '../lib/responses/GetRemoteSummary';
import type { ApplyOptions } from '../lib/tasks/apply-patch';
import type { CheckRepoActions } from '../lib/tasks/check-is-repo';
import type { CleanMode, CleanOptions } from '../lib/tasks/clean';
import type { GitConfigScope } from '../lib/tasks/config';
import type { CountObjectsResult } from '../lib/tasks/count-objects';
import type { GitGrepQuery } from '../lib/tasks/grep';
import type { DefaultLogFields, LogOptions } from '../lib/tasks/log';
import type { ResetMode, ResetOptions } from '../lib/tasks/reset';
import type { VersionResult } from '../lib/tasks/version';
import type {
   Options,
   outputHandler,
   SimpleGitOptions,
   SimpleGitTaskCallback,
   TaskOptions,
} from '../lib/types';
import type {
   BranchMultiDeleteResult,
   BranchSingleDeleteResult,
   BranchSummary,
   CleanSummary,
   CommitResult,
   ConfigGetResult,
   ConfigListSummary,
   DiffResult,
   FetchResult,
   GrepResult,
   InitResult,
   LogResult,
   MergeResult,
   MoveSummary,
   PullResult,
   PushResult,
   StatusResult,
   TagResult,
} from './response';

/**
 * Signature of the {@link simpleGit} factory function, creates a new {@link SimpleGit} instance.
 *
 * The first argument can be either the working directory `git` commands should run in, a
 * {@link SimpleGitOptions} object or `undefined`; the optional second argument is a
 * {@link SimpleGitOptions} object. All configuration properties are optional.
 *
 * ```typescript
 * import { simpleGit } from 'simple-git';
 *
 * const git = simpleGit({
 *    baseDir: process.cwd(),
 *    binary: 'git',
 *    maxConcurrentProcesses: 6,
 *    trimmed: false,
 * });
 *
 * // or split out the baseDir, supported for backward compatibility
 * const other = simpleGit('/some/path', { binary: 'git' });
 * ```
 */
export interface SimpleGitFactory {
   (baseDir?: string, options?: Partial<SimpleGitOptions>): SimpleGit;

   (baseDir: string): SimpleGit;

   (options: Partial<SimpleGitOptions>): SimpleGit;
}

/**
 * Every task returns the {@link SimpleGit} instance so tasks can be chained together, each step in
 * the chain is also a `Promise` that resolves with the result of that task.
 *
 * ```typescript
 * // chain together tasks to await the final result
 * await git.init().addRemote('origin', '...remote.git');
 *
 * // or await each step individually
 * await git.init();
 * await git.addRemote('origin', '...remote.git');
 * ```
 */
export type Response<T> = SimpleGit & Promise<T>;

/**
 * The core set of tasks available on every {@link SimpleGit} instance.
 */
export interface SimpleGitBase {
   /**
    * Adds one or more files to source control, equivalent to `git add <files>`.
    *
    * ```typescript
    * await git.add('./*');
    * await git.add(['file-one.txt', 'file-two.txt']);
    * ```
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-add
    */
   add(files: string | string[], callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Runs a `git` command written as a
    * [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates),
    * resolving with the `stdout` of the command. The literal text is treated as trusted and split on
    * whitespace into arguments, every interpolated `${value}` is treated as untrusted data:
    *
    * - each value becomes exactly one argument (arrays become one argument per item), it is
    *   never split on whitespace or parsed for options
    * - the git sub-command must be written literally
    * - a value can't start an argument with `-` unless it comes after a literal `--` or is
    *   wrapped with {@link pathspec}, use `--option=${value}` for option values
    * - configuration keys must be written literally, `-c user.name=${name}` is permitted,
    *   `-c ${setting}` is not
    * - values selecting a remote helper transport (`ext::...`, `fd::...`) are always rejected
    * - wrap values with {@link remoteUrl} or {@link refName} for stricter validation
    *
    * ```typescript
    * import { pathspec, refName, remoteUrl, simpleGit } from 'simple-git';
    *
    * const git = simpleGit();
    * await git.cmd`clone --depth 1 ${remoteUrl(url, { protocols: ['https'] })} ${pathspec(target)}`;
    * await git.cmd`checkout -b ${refName(branch)}`;
    * await git.cmd`commit --message=${message} -- ${files}`;
    *
    * // rejected before git is run: the value would be read as an option
    * const { branch } = JSON.parse(`{ "branch": "--upload-pack=touch /tmp/pwned" }`);
    * await git.cmd`fetch origin ${branch}`;
    * ```
    *
    * `git.cmd` must be called as a tagged template, use {@link SimpleGit.raw | git.raw} to run a
    * command from an array of arguments. The resulting arguments are subject to the same
    * unsafe-operation and `allowConfig` checks as every other task.
    *
    * @group Running Commands
    */
   cmd(strings: TemplateStringsArray, ...values: TemplateArgvValue[]): Response<string>;

   /**
    * Sets the working directory of the subsequent commands.
    *
    * When `directory` is an object, `root: true` changes the working directory of the main
    * instance, otherwise only the current chain of tasks is affected.
    *
    * ```typescript
    * await git.cwd({ path: '/path/to/repo' }).status(); // this chain only
    * await git.cwd({ path: '/path/to/repo', root: true }); // all future tasks
    * ```
    *
    * @group Instance Settings
    */
   cwd(
      directory: { path: string; root?: boolean },
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Sets the working directory for all future commands. Note: this changes the working
    * directory of the root instance, so every chain created from the root is also changed.
    */
   cwd<path extends string>(
      directory: path,
      callback?: SimpleGitTaskCallback<path>
   ): Response<path>;

   /**
    * Computes the object ID value for the contents of the named file (which can be outside of
    * the work tree), optionally writing the resulting object into the object database.
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-hash-object
    */
   hashObject(path: string, callback?: SimpleGitTaskCallback): Response<string>;

   hashObject(path: string, write?: boolean, callback?: SimpleGitTaskCallback): Response<string>;

   /**
    * Initialises a git repository, set `bare` to `true` to create a bare repository. Any
    * other arguments supported by `git init` can be supplied as {@link TaskOptions}.
    *
    * @group Repository
    * @see https://git-scm.com/docs/git-init
    */
   init(
      bare: boolean,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<InitResult>
   ): Response<InitResult>;

   init(bare: boolean, callback?: SimpleGitTaskCallback<InitResult>): Response<InitResult>;

   init(options?: TaskOptions, callback?: SimpleGitTaskCallback<InitResult>): Response<InitResult>;

   init(callback?: SimpleGitTaskCallback<InitResult>): Response<InitResult>;

   /**
    * Runs a merge using any {@link TaskOptions} supported by `git merge`.
    *
    * Conflicts during the merge result in an error response, whether it was an error or success
    * the response is a {@link MergeResult}. When successful, the `MergeResult` has all detail
    * from a {@link PullResult} along with summary detail for the merge. When the merge failed,
    * the `MergeResult` explains why it failed and which files prevented the merge.
    *
    * ```typescript
    * try {
    *    const merge = await git.merge(['--no-ff', 'feature']);
    * } catch (err) {
    *    const merge: MergeResult = (err as GitResponseError<MergeResult>).git;
    *    console.error(`Merge resulted in ${merge.conflicts.length} conflicts`);
    * }
    * ```
    *
    * @group Merge, Rebase & Reset
    * @see https://git-scm.com/docs/git-merge
    */
   merge(
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<MergeResult>
   ): Response<MergeResult>;

   /**
    * Merges from the specified branch into the currently checked out branch, equivalent to
    * running `git merge ${remote} ${branch}`. Similar to {@link merge} but with the `remote`
    * and `branch` supplied separately to any additional {@link TaskOptions}.
    *
    * @group Merge, Rebase & Reset
    */
   mergeFromTo<E extends GitError>(
      remote: string,
      branch: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<MergeResult, E>
   ): Response<MergeResult>;

   mergeFromTo<E extends GitError>(
      remote: string,
      branch: string,
      callback?: SimpleGitTaskCallback<MergeResult, E>
   ): Response<MergeResult>;

   /**
    * Sets a handler function to be called whenever a new child process is created, the handler
    * is called with the name of the command being run and the `stdout` & `stderr`
    * [readable streams](https://nodejs.org/api/stream.html#stream_class_stream_readable) created by
    * the [child process](https://nodejs.org/api/child_process.html#child_process_class_childprocess).
    *
    * ```typescript
    * simpleGit()
    *    .outputHandler((command, stdout, stderr) => {
    *       stdout.pipe(process.stdout);
    *       stderr.pipe(process.stderr);
    *    })
    *    .clone('https://github.com/user/repo.git');
    * ```
    *
    * @group Instance Settings
    */
   outputHandler(handler: outputHandler | void): this;

   /**
    * Pushes committed changes to the named `remote` and `branch`, with any additional
    * {@link TaskOptions} supported by `git push`.
    *
    * Note that `simple-git` enforces the use of `--verbose --porcelain` options in order to
    * parse the response, these don't need to be supplied.
    *
    * ```typescript
    * await git.push('origin', 'main');
    * await git.push(['-u', 'origin', 'main']);
    * await git.push('origin', 'main', { '--force-with-lease': null });
    * ```
    *
    * @group Remotes & Syncing
    * @see https://git-scm.com/docs/git-push
    */
   push(
      remote?: string,
      branch?: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<PushResult>
   ): Response<PushResult>;

   /**
    * Pushes using the supplied {@link TaskOptions} - for example to push to the default
    * remote, or to supply the remote and branch as part of an options array.
    */
   push(options?: TaskOptions, callback?: SimpleGitTaskCallback<PushResult>): Response<PushResult>;

   push(callback?: SimpleGitTaskCallback<PushResult>): Response<PushResult>;

   /**
    * Stashes the working directory, with any {@link TaskOptions} supported by `git stash`.
    *
    * @group Stash
    * @see https://git-scm.com/docs/git-stash
    */
   stash(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   stash(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Gets the status of the working tree as a {@link StatusResult}, with any additional
    * {@link TaskOptions} supported by `git status`.
    *
    * Limit the status to part of the repo with a {@link pathspec}:
    *
    * ```typescript
    * import { pathspec } from 'simple-git';
    *
    * const status = await git.status([pathspec('sub-dir')]);
    * console.log(status.isClean(), status.modified);
    * ```
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-status
    */
   status(
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<StatusResult>
   ): Response<StatusResult>;

   status(callback?: SimpleGitTaskCallback<StatusResult>): Response<StatusResult>;
}

/**
 * A `simple-git` instance, created by the {@link simpleGit} factory function.
 *
 * Each task returns the instance for chaining together multiple tasks, and each step in the chain
 * is also a `Promise` (see {@link Response}). Tasks can also be supplied a node-style trailing
 * callback function.
 *
 * Where a task accepts custom options, these are supplied as {@link TaskOptions} - either an
 * array of strings or an options object.
 */
export interface SimpleGit extends SimpleGitBase {
   /**
    * Adds an annotated tag to the head of the current branch.
    *
    * @group Tags
    */
   addAnnotatedTag(
      tagName: string,
      tagMessage: string,
      callback?: SimpleGitTaskCallback<{ name: string }>
   ): Response<{ name: string }>;

   /**
    * Adds a configuration property for the `key` (eg: `user.name`) and `value` (eg: `'your name'`).
    *
    * Set `append` to `true` to append to rather than overwrite the key, use the `scope` argument
    * to pick where to save the setting (use the exported {@link GitConfigScope} enum, or the
    * equivalent string values `worktree | local | global | system`), defaults to `local`.
    *
    * ```typescript
    * await git
    *    .addConfig('user.name', 'Some One')
    *    .addConfig('user.email', 'some@one.com');
    * ```
    *
    * @group Configuration
    * @see https://git-scm.com/docs/git-config
    */
   addConfig(
      key: string,
      value: string,
      append?: boolean,
      scope?: keyof typeof GitConfigScope,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   addConfig(
      key: string,
      value: string,
      append?: boolean,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   addConfig(
      key: string,
      value: string,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Applies one patch (or an array of patches) as generated by `git diff`, optionally configured
    * with any {@link TaskOptions} supported by `git apply`. Resolves with the unmodified `stdout`
    * of the `git` binary.
    *
    * @group Merge, Rebase & Reset
    * @see https://git-scm.com/docs/git-apply
    */
   applyPatch(
      patches: string | string[],
      options: TaskOptions<ApplyOptions>,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   applyPatch(
      patches: string | string[],
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Reads the current configuration as a {@link ConfigListSummary}, optionally restricted to a
    * single `scope`.
    *
    * Configuration values are overlaid on top of each other to build the configuration `git`
    * actually uses - to resolve that configuration use `(await git.listConfig()).all` without the
    * `scope` argument.
    *
    * @group Configuration
    */
   listConfig(
      scope: keyof typeof GitConfigScope,
      callback?: SimpleGitTaskCallback<ConfigListSummary>
   ): Response<ConfigListSummary>;

   listConfig(callback?: SimpleGitTaskCallback<ConfigListSummary>): Response<ConfigListSummary>;

   /**
    * Adds a new named remote.
    *
    * @param remoteName name of the remote - eg `"upstream"`
    * @param remoteRepo fully qualified SSH or HTTP(S) path to the remote repo
    * @param options additional {@link TaskOptions} permitted by the `git remote add` command,
    *        merged into the command prior to the remote name and url
    *
    * @group Remotes & Syncing
    * @see https://git-scm.com/docs/git-remote
    */
   addRemote(
      remoteName: string,
      remoteRepo: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   addRemote(
      remoteName: string,
      remoteRepo: string,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Adds a lightweight tag to the head of the current branch.
    *
    * @group Tags
    */
   addTag(
      name: string,
      callback?: SimpleGitTaskCallback<{ name: string }>
   ): Response<{ name: string }>;

   /**
    * Equivalent to {@link catFile} but resolves with the native `Buffer` of content from the
    * `stdout` of the `git` command, use this for binary content.
    *
    * @group History & Inspection
    */
   binaryCatFile(options: string[], callback?: SimpleGitTaskCallback<any>): Response<any>;

   /**
    * Runs `git branch` with any {@link TaskOptions}.
    *
    * Resolves with a {@link BranchSummary} when listing branches, or a
    * {@link BranchSingleDeleteResult} when the options include `-d`, `-D` or `--delete`.
    *
    * @group Branches
    * @see https://git-scm.com/docs/git-branch
    */
   branch(
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<BranchSummary>
   ): Response<BranchSummary>;

   /**
    * Gets the list of local branches as a {@link BranchSummary}.
    *
    * @group Branches
    */
   branchLocal(callback?: SimpleGitTaskCallback<BranchSummary>): Response<BranchSummary>;

   /**
    * Runs `git cat-file` with the supplied array of arguments, for example to list the objects
    * in a tree, or (with `-p`) to determine the type of an object and display its contents.
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-cat-file
    */
   catFile(options: string[], callback?: SimpleGitTaskCallback<string>): Response<string>;

   catFile(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Checks whether the supplied paths are excluded by `.gitignore` rules, resolving with the
    * array of paths that are ignored.
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-check-ignore
    */
   checkIgnore(pathNames: string[], callback?: SimpleGitTaskCallback<string[]>): Response<string[]>;

   checkIgnore(path: string, callback?: SimpleGitTaskCallback<string[]>): Response<string[]>;

   /**
    * Checks whether the working directory is part of a git repo, use the optional `action`
    * to make a more specific assertion (see {@link CheckRepoActions}):
    *
    * - `tree` (default when omitted) - the working directory is a descendent of a repo
    * - `bare` - the working directory is inside a bare repo
    * - `root` - the working directory is the root of a repo (sub-directories resolve `false`)
    *
    * ```typescript
    * if (!(await git.checkIsRepo())) {
    *    await git.init().addRemote('origin', 'https://some.git.repo');
    * }
    * ```
    *
    * @group Repository
    */
   checkIsRepo(
      action?: CheckRepoActions,
      callback?: SimpleGitTaskCallback<boolean>
   ): Response<boolean>;

   checkIsRepo(callback?: SimpleGitTaskCallback<boolean>): Response<boolean>;

   /**
    * Checks out the supplied tag, revision or branch, with any additional {@link TaskOptions}
    * supported by `git checkout`.
    *
    * @group Branches
    * @see https://git-scm.com/docs/git-checkout
    */
   checkout(
      what: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   checkout(what: string, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Checks out a tag or revision using only the supplied {@link TaskOptions}.
    */
   checkout(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Checks out a new branch from the supplied start point, equivalent to
    * `git checkout -b ${branchName} ${startPoint}`.
    *
    * @param branchName name of the new branch
    * @param startPoint where the branch starts, for example `origin/development`
    *
    * @group Branches
    */
   checkoutBranch(
      branchName: string,
      startPoint: string,
      callback?: SimpleGitTaskCallback<void>
   ): Response<void>;

   checkoutBranch(
      branchName: string,
      startPoint: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<void>
   ): Response<void>;

   /**
    * Internally uses pull and tags to get the list of tags then checks out the latest tag.
    *
    * @group Branches
    */
   checkoutLatestTag(
      branchName: string,
      startPoint: string,
      callback?: SimpleGitTaskCallback<void>
   ): Response<void>;

   /**
    * Checks out a new local branch, equivalent to `git checkout -b ${branchName}`.
    *
    * @group Branches
    */
   checkoutLocalBranch(branchName: string, callback?: SimpleGitTaskCallback<void>): Response<void>;

   checkoutLocalBranch(
      branchName: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<void>
   ): Response<void>;

   /**
    * Deletes untracked content from the working tree.
    *
    * The `mode` is a string containing any number of the single character {@link CleanOptions},
    * it must include one of `CleanOptions.FORCE` (`f`) or `CleanOptions.DRY_RUN` (`n`). Any other
    * arguments can be supplied as {@link TaskOptions}.
    *
    * ```typescript
    * import { CleanOptions } from 'simple-git';
    *
    * await git.clean(CleanOptions.FORCE);
    * await git.clean(CleanOptions.DRY_RUN + CleanOptions.RECURSIVE);
    * await git.clean(CleanOptions.FORCE, ['./path']);
    * await git.clean(CleanOptions.IGNORED + CleanOptions.FORCE, { './path': null });
    * ```
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-clean
    */
   clean(
      args: CleanOptions[],
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<CleanSummary>
   ): Response<CleanSummary>;

   clean(
      mode: CleanMode | string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<CleanSummary>
   ): Response<CleanSummary>;

   clean(
      mode: CleanMode | string,
      callback?: SimpleGitTaskCallback<CleanSummary>
   ): Response<CleanSummary>;

   clean(options?: TaskOptions): Response<CleanSummary>;

   clean(callback?: SimpleGitTaskCallback<CleanSummary>): Response<CleanSummary>;

   /**
    * Clones the repo at `repoPath` into `localPath`, with any {@link TaskOptions} supported by
    * `git clone` included between `git clone` and the trailing repo and local path arguments.
    *
    * `repoPath` and `localPath` are passed to `git` as pathspec arguments so are less open to
    * unexpected behaviour when passing unsanitised data into the command - prefer
    * {@link cmd | git.cmd} with {@link remoteUrl} when the url comes from an untrusted source.
    *
    * ```typescript
    * await git.clone('https://github.com/steveukx/git-js.git', './git-js', ['--depth', '1']);
    * ```
    *
    * @param repoPath repository url to clone, eg: `https://github.com/steveukx/git-js.git`
    * @param localPath local folder path to clone to
    * @param options any options supported by `git clone`
    *
    * @group Repository
    * @see https://git-scm.com/docs/git-clone
    */
   clone(
      repoPath: string,
      localPath: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Clones the repo at `repoPath` into a directory in the current working directory with the
    * same name as the repo.
    */
   clone(
      repoPath: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Commits changes in the current working directory with the supplied message - when specific
    * `files` are supplied, only changes on those files are committed.
    *
    * The message can be a single string or an array of strings passed as separate arguments (the
    * `git` command line interface separates these with double line breaks).
    *
    * When supplied, the `options` object can contain any other arguments for `git commit`. A
    * `string` property value adds `name=value` to the command, any other value adds just the `name`.
    *
    * ```typescript
    * await git.commit('first commit!');
    * await git.commit('committed as "Another Person"', 'file-two', {
    *    '--author': '"Another Person <another@person.com>"',
    * });
    * ```
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-commit
    */
   commit(
      message: string | string[],
      files?: string | string[],
      options?: Options,
      callback?: SimpleGitTaskCallback<CommitResult>
   ): Response<CommitResult>;

   commit(
      message: string | string[],
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<CommitResult>
   ): Response<CommitResult>;

   commit(
      message: string | string[],
      files?: string | string[],
      callback?: SimpleGitTaskCallback<CommitResult>
   ): Response<CommitResult>;

   commit(
      message: string | string[],
      callback?: SimpleGitTaskCallback<CommitResult>
   ): Response<CommitResult>;

   /**
    * Queries the pack and disk usage properties of the local repository as a
    * {@link CountObjectsResult}, all disk sizes are reported in KiB.
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-count-objects
    */
   countObjects(callback?: SimpleGitTaskCallback<VersionResult>): Response<CountObjectsResult>;

   /**
    * Sets the path to a custom git binary, should either be `git` when there is an installation
    * of git available on the system path, or a fully qualified path to the executable.
    *
    * Equivalent to the `binary` option of {@link SimpleGitOptions}.
    *
    * @group Instance Settings
    */
   customBinary(command: Exclude<SimpleGitOptions['binary'], undefined>): this;

   /**
    * Deletes a local branch, failure to delete the branch is treated as an error.
    *
    * @param branchName name of the branch
    * @param forceDelete set to `true` to forcibly delete unmerged branches (defaults to `false`)
    *
    * @group Branches
    */
   deleteLocalBranch(
      branchName: string,
      forceDelete?: boolean,
      callback?: SimpleGitTaskCallback<BranchSingleDeleteResult>
   ): Response<BranchSingleDeleteResult>;

   deleteLocalBranch(
      branchName: string,
      callback?: SimpleGitTaskCallback<BranchSingleDeleteResult>
   ): Response<BranchSingleDeleteResult>;

   /**
    * Deletes multiple local branches, resolving with a {@link BranchMultiDeleteResult} summary.
    *
    * @param branchNames names of the branches to delete
    * @param forceDelete set to `true` to forcibly delete unmerged branches (defaults to `false`)
    *
    * @group Branches
    */
   deleteLocalBranches(
      branchNames: string[],
      forceDelete?: boolean,
      callback?: SimpleGitTaskCallback<BranchMultiDeleteResult>
   ): Response<BranchMultiDeleteResult>;

   /**
    * Gets the raw diff of the current repo compared to the last commit, with any additional
    * {@link TaskOptions} supported by `git diff`.
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-diff
    */
   diff(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Gets a {@link DiffResult} summary of the diff for files in the repo. Uses the `--stat` format
    * by default which can be overridden by including another format (eg: `--numstat` or
    * `--name-status`) in the {@link TaskOptions}.
    *
    * To summarise staged changes only, include `--cached` or `--staged`.
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-diff
    */
   diffSummary(
      command: string | number,
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<DiffResult>
   ): Response<DiffResult>;

   diffSummary(
      command: string | number,
      callback?: SimpleGitTaskCallback<DiffResult>
   ): Response<DiffResult>;

   diffSummary(
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<DiffResult>
   ): Response<DiffResult>;

   diffSummary(callback?: SimpleGitTaskCallback<DiffResult>): Response<DiffResult>;

   /**
    * Sets one environment variable for the spawned child processes.
    *
    * Variables in the guarded set (any `GIT_` prefixed name and others such as `EDITOR` or
    * `PAGER`) must also be named in the `allowEnvironment` option of {@link SimpleGitOptions}.
    *
    * ```typescript
    * const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no';
    *
    * await simpleGit({ allowEnvironment: ['GIT_SSH_COMMAND'] })
    *    .env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
    *    .status();
    * ```
    *
    * @group Instance Settings
    */
   env(name: string, value: string): this;

   /**
    * Replaces the environment variables for the spawned child processes. These replace the
    * standard `process.env` variables, so build the new object from `process.env` when the
    * existing variables are still needed:
    *
    * ```typescript
    * git.env({ ...process.env, GIT_SSH_COMMAND });
    * ```
    */
   env(env: object): this;

   /**
    * Calls the supplied `handle` function at the next step in the chain, used to run arbitrary
    * functions synchronously before the next task.
    *
    * ```typescript
    * await git
    *    .exec(() => console.log('Starting pull...'))
    *    .pull()
    *    .exec(() => console.log('pull done.'));
    * ```
    *
    * @group Running Commands
    */
   exec(handle: () => void): Response<void>;

   /**
    * Updates the local working copy database with changes from the named `remote` and `branch`,
    * with any additional {@link TaskOptions} supported by `git fetch`.
    *
    * @group Remotes & Syncing
    * @see https://git-scm.com/docs/git-fetch
    */
   fetch(
      remote: string,
      branch: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<FetchResult>
   ): Response<FetchResult>;

   fetch(
      remote: string,
      branch: string,
      callback?: SimpleGitTaskCallback<FetchResult>
   ): Response<FetchResult>;

   fetch(
      remote: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<FetchResult>
   ): Response<FetchResult>;

   /**
    * Updates the local working copy database with changes from the default remote repo and
    * branch, with any additional {@link TaskOptions}.
    */
   fetch(
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<FetchResult>
   ): Response<FetchResult>;

   fetch(callback?: SimpleGitTaskCallback<FetchResult>): Response<FetchResult>;

   /**
    * Gets the commit hash of the first commit in the repo.
    *
    * @group History & Inspection
    */
   firstCommit(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Gets the value(s) of a configuration property as a {@link ConfigGetResult}, optionally
    * limited to a single `scope` (use the exported {@link GitConfigScope} enum, or the equivalent
    * string values `worktree | local | global | system`). Omit the `scope` to check the complete
    * overlaid configuration visible to the `git` process.
    *
    * @group Configuration
    */
   getConfig(
      key: string,
      scope?: keyof typeof GitConfigScope,
      callback?: SimpleGitTaskCallback<string>
   ): Response<ConfigGetResult>;

   /**
    * Gets the list of named remotes, set `verbose` to `true` to include the URLs and purpose of
    * each remote.
    *
    * @group Remotes & Syncing
    */
   getRemotes(callback?: SimpleGitTaskCallback<RemoteWithoutRefs[]>): Response<RemoteWithoutRefs[]>;

   getRemotes(
      verbose?: false,
      callback?: SimpleGitTaskCallback<RemoteWithoutRefs[]>
   ): Response<RemoteWithoutRefs[]>;

   getRemotes(
      verbose: true,
      callback?: SimpleGitTaskCallback<RemoteWithRefs[]>
   ): Response<RemoteWithRefs[]>;

   /**
    * Searches for a single term, or a complex query built with {@link grepQueryBuilder}, across
    * all files in the working tree, optionally with any {@link TaskOptions} supported by `git grep`.
    *
    * ```typescript
    * import { grepQueryBuilder } from 'simple-git';
    *
    * const { paths, results } = await git.grep('my-search-term');
    * const complex = await git.grep(grepQueryBuilder('a', 'b').and('c'));
    * ```
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-grep
    */
   grep(
      searchTerm: string | GitGrepQuery,
      callback?: SimpleGitTaskCallback<GrepResult>
   ): Response<GrepResult>;

   grep(
      searchTerm: string | GitGrepQuery,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<GrepResult>
   ): Response<GrepResult>;

   /**
    * Parses the trailers from the supplied commit message (a `string` or `Buffer`), does not
    * accept additional options. Omitting the message rejects with a {@link TaskConfigurationError}.
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-interpret-trailers
    */
   interpretTrailers(
      commitMessage: string | Buffer,
      callback?: SimpleGitTaskCallback<Record<string, string>>
   ): Response<Record<string, string>>;

   /**
    * Runs `git ls-remote` with any number of {@link TaskOptions}.
    *
    * ```typescript
    * const heads = await git.listRemote(['--heads', '--tags']);
    * const url = await git.listRemote(['--get-url']);
    * ```
    *
    * @group Remotes & Syncing
    * @see https://git-scm.com/docs/git-ls-remote
    */
   listRemote(args?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Lists commits as a {@link LogResult}, from `HEAD` to the first commit unless limited by
    * the `from` and `to` options. Use the options object to set any of the {@link LogOptions}
    * or any {@link TaskOptions} supported by `git log`.
    *
    * By default each commit includes the {@link DefaultLogFields}, set `options.format` to an
    * object mapping property names to
    * [pretty format](https://git-scm.com/docs/pretty-formats) placeholders to choose the fields.
    *
    * ```typescript
    * const all = await git.log();
    * const range = await git.log({ from: '0.11.0', to: '0.12.0' });
    * const file = await git.log({ file: 'package.json', maxCount: 10 });
    * const custom = await git.log({ format: { hash: '%H', subject: '%s' } });
    * ```
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-log
    */
   log<T = DefaultLogFields>(
      options?: TaskOptions | LogOptions<T>,
      callback?: SimpleGitTaskCallback<LogResult<T>>
   ): Response<LogResult<T>>;

   /**
    * Mirrors a git repo, equivalent to `git.clone(repoPath, localPath, ['--mirror'])`, use
    * {@link clone} when additional task options are needed.
    *
    * @group Repository
    * @see https://git-scm.com/docs/git-clone#Documentation/git-clone.txt---mirror
    */
   mirror(
      repoPath: string,
      localPath: string,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Renames or moves a single file `from` to `to`, or moves all files in the `from` array into
    * the `to` directory.
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-mv
    */
   mv(
      from: string | string[],
      to: string,
      callback?: SimpleGitTaskCallback<MoveSummary>
   ): Response<MoveSummary>;

   /**
    * Pulls updates from the specified `remote` and `branch` (eg: `'origin'`, `'main'`), with any
    * additional {@link TaskOptions} supported by `git pull`.
    *
    * When the `git pull` fails with a recognised fatal error, the task rejects with a
    * `GitResponseError<PullFailedResult>`.
    *
    * ```typescript
    * const update = await git.pull('origin', 'main', { '--no-rebase': null });
    * if (update.summary.changes) {
    *    console.log('changes received');
    * }
    * ```
    *
    * @group Remotes & Syncing
    * @see https://git-scm.com/docs/git-pull
    */
   pull(
      remote?: string,
      branch?: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<PullResult>
   ): Response<PullResult>;

   /**
    * Pulls all updates from the default tracked remote, with any additional {@link TaskOptions}.
    */
   pull(options?: TaskOptions, callback?: SimpleGitTaskCallback<PullResult>): Response<PullResult>;

   pull(callback?: SimpleGitTaskCallback<PullResult>): Response<PullResult>;

   /**
    * Pushes local tags to a remote which can be either a URL or named remote, equivalent to
    * `git.push([remote, '--tags'])`. When not specified uses the default configured remote.
    *
    * @group Tags
    */
   pushTags(
      remote: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<PushResult>
   ): Response<PushResult>;

   pushTags(
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<PushResult>
   ): Response<PushResult>;

   pushTags(callback?: SimpleGitTaskCallback<PushResult>): Response<PushResult>;

   /**
    * Executes any command supported by the `git` binary, resolving with its `stdout`. Use this
    * when no task in the API wraps the command needed. When the `git` process exits with a non-zero
    * code and printed something to `stderr` the task rejects, otherwise it is treated as a success.
    *
    * The arguments are treated as trusted, use {@link cmd | git.cmd} to include untrusted data.
    *
    * ```typescript
    * const commands = ['config', '--global', 'advice.pushNonFastForward', 'false'];
    *
    * await git.raw(commands);
    * await git.raw(...commands);
    *
    * // trim trailing white-space in the response
    * await simpleGit({ trimmed: true }).raw('rev-parse', '--show-toplevel');
    * ```
    *
    * @group Running Commands
    */
   raw(
      commands: string | string[] | TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   raw(options: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   raw(...commands: string[]): Response<string>;

   // leading varargs with trailing options/callback
   raw(a: string, options: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   raw(
      a: string,
      b: string,
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   raw(
      a: string,
      b: string,
      c: string,
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   raw(
      a: string,
      b: string,
      c: string,
      d: string,
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   raw(
      a: string,
      b: string,
      c: string,
      d: string,
      e: string,
      options: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   // leading varargs with trailing callback
   raw(a: string, callback?: SimpleGitTaskCallback<string>): Response<string>;

   raw(a: string, b: string, callback?: SimpleGitTaskCallback<string>): Response<string>;

   raw(a: string, b: string, c: string, callback?: SimpleGitTaskCallback<string>): Response<string>;

   raw(
      a: string,
      b: string,
      c: string,
      d: string,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   raw(
      a: string,
      b: string,
      c: string,
      d: string,
      e: string,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Rebases the current working copy, with any {@link TaskOptions} supported by `git rebase`.
    *
    * @group Merge, Rebase & Reset
    * @see https://git-scm.com/docs/git-rebase
    */
   rebase(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   rebase(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Runs any `git remote` command with the arguments passed as an array of strings.
    *
    * @group Remotes & Syncing
    * @see https://git-scm.com/docs/git-remote
    */
   remote(
      options: string[],
      callback?: SimpleGitTaskCallback<void | string>
   ): Response<void | string>;

   /**
    * Removes the named remote.
    *
    * @param remoteName name of the remote - eg `"upstream"`
    *
    * @group Remotes & Syncing
    */
   removeRemote(remoteName: string, callback?: SimpleGitTaskCallback<void>): Response<void>;

   /**
    * Resets the repo. Set the `mode` to one of the {@link ResetMode} values (or the equivalent
    * strings `mixed`, `soft`, `hard`, `merge`, `keep`), called without a mode this is a `soft`
    * reset of the whole repo.
    *
    * Any other arguments supported by `git reset` can be supplied as {@link TaskOptions}, for
    * example to restrict the pathspec:
    *
    * ```typescript
    * import { ResetMode } from 'simple-git';
    *
    * // equivalent to each other
    * await git.reset(ResetMode.HARD, ['--', 'my-file.txt']);
    * await git.reset(['--hard', '--', 'my-file.txt']);
    * await git.reset(ResetMode.HARD, { '--': null, 'my-file.txt': null });
    * await git.reset({ '--hard': null, '--': null, 'my-file.txt': null });
    * ```
    *
    * @group Merge, Rebase & Reset
    * @see https://git-scm.com/docs/git-reset
    */
   reset(
      mode: ResetMode,
      options?: TaskOptions<ResetOptions>,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   reset(mode: ResetMode, callback?: SimpleGitTaskCallback<string>): Response<string>;

   reset(
      options?: TaskOptions<ResetOptions>,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Reverts one or more commits in the working copy, with any {@link TaskOptions} supported by
    * `git revert`.
    *
    * @param commit any commit-ish value (hash, name or offset such as `HEAD~2`) or a range of
    *        commits (eg: `main~5..main~2`)
    *
    * @group Merge, Rebase & Reset
    * @see https://git-scm.com/docs/git-revert
    */
   revert(
      commit: String,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<void>
   ): Response<void>;

   revert(commit: String, callback?: SimpleGitTaskCallback<void>): Response<void>;

   /**
    * Passes the supplied options to `git rev-parse` and resolves with the string response.
    *
    * Example uses of `rev-parse` include converting friendly commit references (ie: branch names)
    * to SHA1 hashes and retrieving meta details about the current repo (eg: the root directory,
    * and whether it was created as a bare repo).
    *
    * ```typescript
    * const head = await git.revparse('HEAD');
    * const root = await git.revparse(['--show-toplevel']);
    * ```
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-rev-parse
    */
   revparse(
      option: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   revparse(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Removes the named files from source control and deletes them from disk.
    *
    * @group Staging & Committing
    * @see https://git-scm.com/docs/git-rm
    */
   rm(paths: string | string[], callback?: SimpleGitTaskCallback<void>): Response<void>;

   /**
    * Removes the named files from source control but keeps them on disk rather than deleting
    * them entirely. To completely remove the files, use {@link rm}.
    *
    * @group Staging & Committing
    */
   rmKeepLocal(paths: string | string[], callback?: SimpleGitTaskCallback<void>): Response<void>;

   /**
    * Shows various types of objects, for example the content of a file at a certain commit.
    * The `option` is either a single string, or any {@link TaskOptions} supported by `git show`.
    *
    * ```typescript
    * const content = await git.show('main:package.json');
    * ```
    *
    * @group History & Inspection
    * @see https://git-scm.com/docs/git-show
    */
   show(option: string | TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   show(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Same as {@link show}, but resolves with the `Buffer` content directly to allow for showing
    * binary file content.
    *
    * @group History & Inspection
    */
   showBuffer(option: string | TaskOptions): Response<Buffer>;

   /**
    * Retrieves the stash list as a {@link LogResult}, the optional `options` are in the same
    * format as used by {@link log}.
    *
    * @group Stash
    */
   stashList(
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<LogResult>
   ): Response<LogResult>;

   stashList(callback?: SimpleGitTaskCallback<LogResult>): Response<LogResult>;

   /**
    * Runs any `git submodule` command with the supplied {@link TaskOptions}.
    *
    * @group Submodules
    * @see https://git-scm.com/docs/git-submodule
    */
   subModule(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Adds the `repo` as a new submodule at `path`.
    *
    * @group Submodules
    */
   submoduleAdd(
      repo: string,
      path: string,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   /**
    * Initialises submodules, the optional {@link TaskOptions} are passed to the
    * `git submodule init` command.
    *
    * @group Submodules
    */
   submoduleInit(
      moduleName: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   submoduleInit(moduleName: string, callback?: SimpleGitTaskCallback<string>): Response<string>;

   submoduleInit(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   submoduleInit(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Updates submodules, can be called with a submodule name and {@link TaskOptions}, just the
    * options or with no arguments.
    *
    * @group Submodules
    */
   submoduleUpdate(
      moduleName: string,
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   submoduleUpdate(moduleName: string, callback?: SimpleGitTaskCallback<string>): Response<string>;

   submoduleUpdate(
      options?: TaskOptions,
      callback?: SimpleGitTaskCallback<string>
   ): Response<string>;

   submoduleUpdate(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Runs any `git tag` command with the supplied {@link TaskOptions}, resolving with the raw
    * response. Use {@link tags} for a parsed list of tags.
    *
    * @group Tags
    * @see https://git-scm.com/docs/git-tag
    */
   tag(options?: TaskOptions, callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Lists all tags as a {@link TagResult}, with any {@link TaskOptions} supported by `git tag`.
    *
    * Tags are sorted by semantic version number by default, when using git 2.7.0 or above include
    * an options object with `"--sort": "property-name"` to sort the tags by that property instead.
    * Supplying this option when it is not supported by your version of git will cause the task to fail.
    *
    * ```typescript
    * const { all, latest } = await git.tags();
    * ```
    *
    * @group Tags
    */
   tags(options?: TaskOptions, callback?: SimpleGitTaskCallback<TagResult>): Response<TagResult>;

   tags(callback?: SimpleGitTaskCallback<TagResult>): Response<TagResult>;

   /**
    * Updates the auxiliary info file used by dumb servers.
    *
    * @group Repository
    * @see https://git-scm.com/docs/git-update-server-info
    */
   updateServerInfo(callback?: SimpleGitTaskCallback<string>): Response<string>;

   /**
    * Retrieves the `major`, `minor` and `patch` version of the installed `git` (or the
    * configured custom binary) as a {@link VersionResult}. Use the `installed` property of the
    * result to check whether `git` is available at all.
    *
    * ```typescript
    * const { installed, major, minor } = await simpleGit().version();
    * if (!installed) {
    *    throw new Error(`Exit: "git" not available.`);
    * }
    * ```
    *
    * @group Repository
    */
   version(callback?: SimpleGitTaskCallback<VersionResult>): Response<VersionResult>;
}
