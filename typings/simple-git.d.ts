import * as resp from './response';
import * as types from './types';
import { Options } from './types';

export interface SimpleGit {
   /**
    * Adds one or more files to source control
    *
    * @param {string|string[]} files
    * @returns {Promise<void>}
    */
   add(files: string | string[]): Promise<void>;

   /**
    * Add an annotated tag to the head of the current branch
    *
    * @param {string} tagName
    * @param {string} tagMessage
    * @returns {Promise<{name: string}>}
    */
   addAnnotatedTag(tagName: string, tagMessage: string): Promise<{name: string}>;

   /**
    * Add config to local git instance
    *
    * @param {string} key configuration key (e.g user.name)
    * @param {string} value for the given key (e.g your name)
    * @param {boolean} [append=false] optionally append the key/value pair (equivalent of passing `--add` option).
    * @returns {Promise<string>}
    */
   addConfig(key: string, value: string, append?: boolean): Promise<string>;

   /**
    * Configuration values visible to git in the current working directory
    */
   listConfig(): Promise<types.ConfigListSummary>;

   /**
    * Adds a remote to the list of remotes.
    *
    * @param {string} remoteName Name of the repository - eg "upstream"
    * @param {string} remoteRepo Fully qualified SSH or HTTP(S) path to the remote repo
    * @param {Options} [options] Optional additional settings permitted by the `git remote add` command, merged into the command prior to the repo name and remote url
    */
   addRemote(remoteName: string, remoteRepo: string, options?: Options): Promise<void>;

   /**
    * Add a lightweight tag to the head of the current branch
    *
    * @param {string} name
    * @returns {Promise<string>}
    */
   addTag(name: string): Promise<{name: string}>;

   /**
    * Equivalent to `catFile` but will return the native `Buffer` of content from the git command's stdout.
    *
    * @param {string[]} options
    */
   binaryCatFile(options: string[]): Promise<any>;

   /**
    * List all branches
    */
   branch(): Promise<types.BranchSummary>;
   branch(options: Options | string[]): Promise<types.BranchSummary>;

   /**
    * List of local branches
    *
    * @returns {Promise<types.BranchSummary>}
    */
   branchLocal(): Promise<types.BranchSummary>;

   /**
    * Returns a list of objects in a tree based on commit hash.
    * Passing in an object hash returns the object's content, size, and type.
    *
    * Passing "-p" will instruct cat-file to determine the object type, and display its formatted contents.
    *
    * @param {string[]} [options]
    * @returns {Promise<string>}
    *
    * @see https://git-scm.com/docs/git-cat-file
    */
   catFile(options: string[]): Promise<string>;

   /**
    * Check if a pathname or pathnames are excluded by .gitignore
    *
    * @param {string|string[]} pathnames
    */
   checkIgnore(pathnames: string[]): Promise<string[]>;

   checkIgnore(path: string): Promise<string[]>;

   /**
    * Validates that the current repo is a Git repo.
    *
    * @returns {Promise<boolean>}
    */
   checkIsRepo(): Promise<boolean>;

   /**
    * Checkout a tag or revision, any number of additional arguments can be passed to the `git* checkout` command
    by supplying either a string or array of strings as the `what` parameter.
    *
    * @param {(string | string[])} what one or more commands to pass to `git checkout`.
    * @returns {Promise<void>}
    */
   checkout(what: string | string[]): Promise<void>;

   /**
    * Checkout a remote branch.
    *
    * @param {string} branchName name of branch.
    * @param {string} startPoint (e.g origin/development).
    * @returns {Promise<void>}
    */
   checkoutBranch(branchName: string, startPoint: string): Promise<void>;

   /**
    * Internally uses pull and tags to get the list of tags then checks out the latest tag.
    */
   checkoutLatestTag(branchName: string, startPoint: string): Promise<void>;

   /**
    * Checkout a local branch
    *
    * @param {string} branchName name of branch.
    * @returns {Promise<void>}
    */
   checkoutLocalBranch(branchName: string): Promise<void>;

   /**
    * Deletes unwanted content from the local repo - when supplying the first argument as
    * an array of `CleanOptions`, the array must include one of `CleanOptions.FORCE` or
    * `CleanOptions.DRY_RUN`.
    *
    * eg:
    *
    * ```typescript
    await git.clean(CleanOptions.FORCE);
    await git.clean(CleanOptions.DRY_RUN + CleanOptions.RECURSIVE);
    await git.clean(CleanOptions.FORCE, ['./path']);
    await git.clean(CleanOptions.IGNORED + CleanOptions.FORCE, {'./path': null});
    * ```
    */
   clean(args: types.CleanOptions[], options?: Options | string[]): Promise<types.CleanSummary>;
   clean(mode: types.CleanMode | string, options?: Options | string[]): Promise<types.CleanSummary>;

   /**
    * Clears the queue of pending commands and returns the wrapper instance for chaining.
    */
   clearQueue(): this;

   /**
    * Clone a repository into a new directory.
    *
    * @param {string} repoPath repository url to clone e.g. https://github.com/steveukx/git-js.git
    * @param {string} localPath local folder path to clone to.
    * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-clone).
    * @returns {Promise<void>}
    */
   clone(repoPath: string, localPath: string, options?: Options | string[]): Promise<string>;
   clone(repoPath: string, options?: Options | string[]): Promise<string>;

   /**
    * Commits changes in the current working directory - when specific file paths are supplied, only changes on those
    * files will be committed.
    *
    * @param {string|string[]} message
    * @param {string|string[]} [files]
    * @param {Object} [options]
    */
   commit(
      message: string | string[],
      files?: string | string[],
      options?: Options
   ): Promise<resp.CommitSummary>;

   /**
    * Sets the path to a custom git binary, should either be `git` when there is an installation of git available on
    * the system path, or a fully qualified path to the executable.
    *
    * @param {string} command
    */
   customBinary(command: string): this;

   /**
    * Sets the working directory of the subsequent commands.
    *
    * @param {string} workingDirectory
    */
   cwd<path extends string>(workingDirectory: path): Promise<path>;

   /**
    * Delete one local branch. Supply the branchName as a string to return a
    * single `BranchDeletionSummary` instances.
    *
    * @param {string} branchName name of branch
    * @param {boolean} [forceDelete=false] set to true to forcibly delete unmerged branches
    */
   deleteLocalBranch(branchName: string, forceDelete?: boolean): Promise<types.BranchDeletionSummary>;

   /**
    * Delete one or more local branches. Supply the branchName as a string to return a
    * single `BranchDeletionSummary` or as an array of branch names to return an array of
    * `BranchDeletionSummary` instances.
    *
    * @param {string[]} branchNames name of branch or array of branch names
    * @param {boolean} [forceDelete=false] set to true to forcibly delete unmerged branches
    */
   deleteLocalBranches(branchNames: string[], forceDelete?: boolean): Promise<types.BranchDeletionSummary[]>;

   /**
    * Get the diff of the current repo compared to the last commit with a set of options supplied as a string.
    *
    * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-diff).
    * @returns {Promise<string>} raw string result.
    */
   diff(options?: string[]): Promise<string>;

   /**
    * Gets a summary of the diff for files in the repo, uses the `git diff --stat` format to calculate changes.
    *
    * in order to get staged (only): `--cached` or `--staged`.
    *
    * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-diff).
    * @returns {Promise<DiffResult>} Parsed diff summary result.
    */
   diffSummary(options?: string[]): Promise<resp.DiffResult>;

   /**
    * Sets an environment variable for the spawned child process, either supply both a name and value as strings or
    * a single object to entirely replace the current environment variables.
    *
    * @param {string|Object} name
    * @param {string} [value]
    */
   env(name: string, value: string): this;

   env(env: object): this;

   /**
    * Updates the local working copy database with changes from the default remote repo and branch.
    *
    * @param {string | string[]} [remote] remote to fetch from.
    * @param {string} [branch] branch to fetch from.
    * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-fetch).
    * @returns {Promise<FetchResult>} Parsed fetch result.
    */
   fetch(remote?: string | string[], branch?: string, options?: Options): Promise<resp.FetchResult>;

   /**
    * Gets the currently available remotes, setting the optional verbose argument to true includes additional
    * detail on the remotes themselves.
    *
    * @param {boolean} [verbose=false]
    */
   getRemotes(verbose?: false): Promise<types.RemoteWithoutRefs[]>;

   getRemotes(verbose: true): Promise<types.RemoteWithRefs[]>;

   /**
    * Initialize a git repo
    *
    * @param {Boolean} [bare=false]
    */
   init(bare?: boolean): Promise<void>;

   /**
    * List remotes by running the `ls-remote` command with any number of arbitrary options
    * in either array of object form.
    */
   listRemote(args?: Options): Promise<string>;

   /**
    * Show commit logs from `HEAD` to the first commit.
    * If provided between `options.from` and `options.to` tags or branch.
    *
    * You can provide `options.file`, which is the path to a file in your repository. Then only this file will be considered.
    *
    * To use a custom splitter in the log format, set `options.splitter` to be the string the log should be split on.
    *
    * By default the following fields will be part of the result:
    *   `hash`: full commit hash
    *   `date`: author date, ISO 8601-like format
    *   `message`: subject + ref names, like the --decorate option of git-log
    *   `author_name`: author name
    *   `author_email`: author mail
    * You can specify `options.format` to be an mapping from key to a format option like `%H` (for commit hash).
    * The fields specified in `options.format` will be the fields in the result.
    *
    * Options can also be supplied as a standard options object for adding custom properties supported by the git log command.
    * For any other set of options, supply options as an array of strings to be appended to the git log command.
    *
    * @param {LogOptions} [options]
    *
    * @returns Promise<ListLogSummary>
    *
    * @see https://git-scm.com/docs/git-log
    */
   log<T = types.DefaultLogFields>(options?: types.LogOptions<T>): Promise<resp.ListLogSummary<T>>;

   /**
    * Runs a merge, `options` can be either an array of arguments
    * supported by the [`git merge`](https://git-scm.com/docs/git-merge)
    * or an options object.
    *
    * Conflicts during the merge result in an error response,
    * the response type whether it was an error or success will be a MergeSummary instance.
    * When successful, the MergeSummary has all detail from a the PullSummary
    *
    * @param {Options | string[]} [options] options supported by [git](https://git-scm.com/docs/git-merge).
    * @returns {Promise<any>}
    *
    * @see https://github.com/steveukx/git-js/blob/master/src/responses/MergeSummary.js
    * @see https://github.com/steveukx/git-js/blob/master/src/responses/PullSummary.js
    */
   merge(options: Options | string[]): Promise<resp.MergeSummary>;

   /**
    * Merges from one branch to another, equivalent to running `git merge ${from} $[to}`, the `options` argument can
    * either be an array of additional parameters to pass to the command or null / omitted to be ignored.
    *
    * @param {string} from branch to merge from.
    * @param {string} to branch to merge to.
    * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-merge).
    * @returns {Promise<string>}
    */
   mergeFromTo(from: string, to: string, options?: string[]): Promise<string>;

   /**
    * Mirror a git repo
    *
    * @param {string} repoPath
    * @param {string} localPath
    */
   mirror(repoPath: string, localPath: string): Promise<string>;

   /**
    * Moves one or more files to a new destination.
    *
    * @see https://git-scm.com/docs/git-mv
    *
    * @param {string|string[]} from
    * @param {string} to
    */
   mv(from: string | string[], to: string): Promise<resp.MoveSummary>;

   /**
    * Sets a handler function to be called whenever a new child process is created, the handler function will be called
    * with the name of the command being run and the stdout & stderr streams used by the ChildProcess.
    *
    * @example
    * require('simple-git')
    *    .outputHandler(function (command, stdout, stderr) {
    *       stdout.pipe(process.stdout);
    *    })
    *    .checkout('https://github.com/user/repo.git');
    *
    * @see https://nodejs.org/api/child_process.html#child_process_class_childprocess
    * @see https://nodejs.org/api/stream.html#stream_class_stream_readable
    */
   outputHandler(handler: types.outputHandler | void): this;

   /**
    * Fetch from and integrate with another repository or a local branch.
    *
    * @param {string} [remote] remote to pull from.
    * @param {string} [branch] branch to pull from.
    * @param {Options} [options] options supported by [git](https://git-scm.com/docs/git-pull).
    * @returns {Promise<PullResult>} Parsed pull result.
    */
   pull(remote?: string, branch?: string, options?: Options): Promise<resp.PullResult>;

   /**
    * Update remote refs along with associated objects.
    *
    * @param {string} [remote] remote to push to.
    * @param {string} [branch] branch to push to.
    * @param {Options} [options] options supported by [git](https://git-scm.com/docs/git-push).
    * @returns {Promise<void>}
    */
   push(remote?: string, branch?: string, options?: Options): Promise<void>;

   /**
    * Pushes the current tag changes to a remote which can be either a URL or named remote. When not specified uses the
    * default configured remote spec.
    *
    * @param {string} [remote]
    */
   pushTags(remote?: string): Promise<string>;

   /**
    * Executes any command against the git binary.
    *
    * @param {string[]|Object} commands
    */
   raw(...commands: string[]): Promise<string>;
   raw(commands: string | string[]): Promise<string>;

   /**
    * Rebases the current working copy. Options can be supplied either as an array of string parameters
    * to be sent to the `git rebase` command, or a standard options object.
    *
    * @param {Object|String[]} [options]
    */
   rebase(options?: Options | string[]): Promise<string>;

   /**
    * Call any `git remote` function with arguments passed as an array of strings.
    *
    * @param {string[]} options
    */
   remote(options: string[]): Promise<void | string>;

   /**
    * Removes an entry from the list of remotes.
    *
    * @param {string} remoteName Name of the repository - eg "upstream"
    */
   removeRemote(remoteName: string): Promise<void>;

   /**
    * Reset a repo
    *
    * @param {string|string[]} [mode=soft] Either an array of arguments supported by the 'git reset' command, or the string value 'soft' or 'hard' to set the reset mode.
    */
   reset(mode?: 'soft' | 'mixed' | 'hard' | 'merge' | 'keep'): Promise<null>;

   reset(commands?: string[]): Promise<void>;

   /**
    * Revert one or more commits in the local working copy
    *
    * @param {string} commit The commit to revert. Can be any hash, offset (eg: `HEAD~2`) or range (eg: `master~5..master~2`)
    * @param {Object} [options] Optional options object
    */
   revert(commit: String, options?: Options): Promise<void>;

   /**
    * Wraps `git rev-parse`. Primarily used to convert friendly commit references (ie branch names) to SHA1 hashes.
    *
    * Options should be an array of string options compatible with the `git rev-parse`
    *
    * @param {string[]} [options]
    *
    * @returns Promise<string>
    *
    * @see https://git-scm.com/docs/git-rev-parse
    */
   revparse(options?: string[]): Promise<string>;

   /**
    * Removes the named files from source control.
    *
    * @param {string|string[]} paths
    */
   rm(paths: string | string[]): Promise<void>;

   /**
    * Removes the named files from source control but keeps them on disk rather than deleting them entirely. To
    * completely remove the files, use `rm`.
    *
    * @param {string|string[]} paths
    */
   rmKeepLocal(paths: string | string[]): Promise<void>;

   /**
    * Show various types of objects, for example the file at a certain commit
    *
    * @param {string[]} [options]
    */
   show(options?: string[]): Promise<string>;

   /**
    * @deprecated
    *
    * From version 2.7.0, use of `silent` is deprecated in favour of using the `debug` library, this method will
    * be removed in version 3.x.
    *
    * Please see the [readme](https://github.com/steveukx/git-js/blob/master/readme.md#enable-logging) for more details.
    *
    * Disables/enables the use of the console for printing warnings and errors, by default messages are not shown in
    * a production environment.
    *
    * @param {boolean} silence
    */
   silent(silence?: boolean): this;

   /**
    * Stash the local repo
    *
    * @param {Object|Array} [options]
    */
   stash(options?: Options | any[]): Promise<string>;

   /**
    * List the stash(s) of the local repo
    *
    * @param {Object|Array} [options]
    */
   stashList(options?: Options | string[]): Promise<resp.ListLogSummary>;

   /**
    * Show the working tree status.
    *
    * @returns {Promise<StatusResult>} Parsed status result.
    */
   status(): Promise<resp.StatusResult>;

   /**
    * Call any `git submodule` function with arguments passed as an array of strings.
    */
   subModule(options?: Options): Promise<string>;

   /**
    * Add a submodule
    */
   submoduleAdd(repo: string, path: string): Promise<string>;

   /**
    * Initialise submodules
    */
   submoduleInit(moduleName: string, options?: Options): Promise<string>;
   submoduleInit(options?: Options): Promise<string>;

   /**
    * Update submodules
    */
   submoduleUpdate(moduleName: string, options?: Options): Promise<string>;
   submoduleUpdate(options?: Options): Promise<string>;

   /**
    * List all tags. When using git 2.7.0 or above, include an options object with `"--sort": "property-name"` to
    * sort the tags by that property instead of using the default semantic versioning sort.
    *
    * Note, supplying this option when it is not supported by your Git version will cause the operation to fail.
    *
    * @param {Object} [options]
    */
   tag(options?: Options | string[]): Promise<string>;

   /**
    * Gets a list of tagged versions.
    *
    * @param {Options} options
    * @returns {Promise<TagResult>} Parsed tag list.
    */
   tags(options?: Options): Promise<resp.TagResult>;

   /**
    * Updates repository server info
    */
   updateServerInfo(): Promise<string>;
}
