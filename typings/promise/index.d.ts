import * as resp from "../response";

declare function simplegit(basePath?: string): simplegit.SimpleGit;

declare namespace simplegit {

   interface SimpleGit {

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
       * @returns {Promise<void>}
       */
      addAnnotatedTag(tagName: string, tagMessage: string): Promise<void>;

      /**
       * Add config to local git instance
       *
       * @param {string} key configuration key (e.g user.name)
       * @param {string} value for the given key (e.g your name)
       * @returns {Promise<string>}
       */
      addConfig(key: string, value: string): Promise<string>;

      /**
       * Adds a remote to the list of remotes.
       *
       * @param {string} remoteName Name of the repository - eg "upstream"
       * @param {string} remoteRepo Fully qualified SSH or HTTP(S) path to the remote repo
       * @returns {Promise<void>}
       */
      addRemote(remoteName: string, remoteRepo: string): Promise<void>;

      /**
       * Add a lightweight tag to the head of the current branch
       *
       * @param {string} name
       * @returns {Promise<string>}
       */
      addTag(name: string): Promise<string>;

      /**
       * List all branches
       *
       * @param {string[] | Object} [options]
       * @returns {Promise<BranchSummary>}
       */
      branch(options: string[] | Options): Promise<BranchSummary>;

      /**
       * List of local branches
       *
       * @returns {Promise<BranchSummary>}
       */
      branchLocal(): Promise<BranchSummary>;

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
       * Checkout a local branch
       *
       * @param {string} branchName name of branch.
       * @returns {Promise<void>}
       */
      checkoutLocalBranch(branchName: string): Promise<void>;

      /**
       * Clone a repository into a new directory.
       *
       * @param {string} repoPath repository url to clone e.g. https://github.com/steveukx/git-js.git
       * @param {string} localPath local folder path to clone to.
       * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-clone).
       * @returns {Promise<void>}
       */
      clone(repoPath: string, localPath: string, options?: string[]): Promise<void>;

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
      diffSummary(options?: string[]): Promise<DiffResult>;

      /**
       * Updates the local working copy database with changes from the default remote repo and branch.
       *
       * @param {string | string[]} [remote] remote to fetch from.
       * @param {string} [branch] branch to fetch from.
       * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-fetch).
       * @returns {Promise<FetchResult>} Parsed fetch result.
       */
      fetch(remote?: string | string[], branch?: string, options?: Options): Promise<FetchResult>;

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
      log<T = resp.DefaultLogFields>(options?: LogOptions<T>): Promise<resp.ListLogSummary<T>>;

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
      merge(options: Options | string[]): Promise<any>;

      /**
       * Fetch from and integrate with another repository or a local branch.
       *
       * @param {string} [remote] remote to pull from.
       * @param {string} [branch] branch to pull from.
       * @param {Options} [options] options supported by [git](https://git-scm.com/docs/git-pull).
       * @returns {Promise<PullResult>} Parsed pull result.
       */
      pull(remote?: string, branch?: string, options?: Options): Promise<PullResult>;

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
       * Wraps `git rev-parse`. Primarily used to convert friendly commit references (ie branch names) to SHA1 hashes.
       *
       * Options should be an array of string options compatible with the `git rev-parse`
       *
       * @param {string[]} [options]
       *
       * @returns Promise<string>
       *
       * @see http://git-scm.com/docs/git-rev-parse
       */
      revparse(options?: string[]): Promise<string>;

      /**
       * Show the working tree status.
       *
       * @returns {Promise<StatusResult>} Parsed status result.
       */
      status(): Promise<StatusResult>;

      /**
       * Gets a list of tagged versions.
       *
       * @param {Options} options
       * @returns {Promise<TagResult>} Parsed tag list.
       */
      tags(options?: Options): Promise<TagResult>;

      /**
       * Disables/enables the use of the console for printing warnings and errors, by default messages are not shown in
       * a production environment.
       *
       * @param {boolean} silence
       * @returns {simplegit.SimpleGit}
       */
      silent(silence?: boolean): simplegit.SimpleGit;
   }

   type Options = {[key: string]: null | string | any};

   type LogOptions<T = resp.DefaultLogFields> = Options & {
      format?: T;
      file?: string;
      from?: string;
      to?: string;
   };

   // responses
   // ---------------------
   interface BranchSummary extends resp.BranchSummary {}

   interface PullResult extends resp.PullResult {}

   interface FetchResult extends resp.FetchResult {}

   interface StatusResult extends resp.StatusResult {}

   interface DiffResult extends resp.DiffResult {}

   interface TagResult extends resp.TagResult {}

}

export = simplegit;
