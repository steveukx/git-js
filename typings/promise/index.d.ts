import * as resp from "../response";

declare function simplegit(basePath?: string): simplegit.SimpleGit;

declare namespace simplegit {

	interface SimpleGit {

		/**
		 * Check out a tag or revision, any number of additional arguments can be passed to the `git checkout` command
		 * by supplying either a string or array of strings as the `what` parameter.
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
		 * @returns {Promise<DiffSummaryResult>} Parsed diff summary result.
		 */
		diffSummary(options?: string[]): Promise<DiffResult>;

		/**
		 * Updates the local working copy database with changes from the default remote repo and branch.
		 *
		 * @param {string} [remote] remote to fetch from.
		 * @param {string} [branch] branch to fetch from.
		 * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-fetch).
		 * @returns {Promise<FetchResult>} Parsed fetch result.
		 */
		fetch(remote?: string, branch?: string, options?: string[]): Promise<FetchResult>;

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
		 *  Join two or more development histories together.
		 *
		 * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-merge).
		 * @returns {Promise<string>}
		 */
		merge(options: string[]): Promise<string>;

		/**
		 * Fetch from and integrate with another repository or a local branch.
		 *
		 * @param {string} [remote] remote to pull from.
		 * @param {string} [branch] branch to pull from.
		 * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-pull).
		 * @returns {Promise<PullResult>} Parsed pull result.
		 */
		pull(remote?: string, branch?: string, options?: string[]): Promise<PullResult>;

		/**
		 * Update remote refs along with associated objects.
		 *
		 * @param {string} [remote] remote to push to.
		 * @param {string} [branch] branch to push to.
		 * @param {string[]} [options] options supported by [git](https://git-scm.com/docs/git-push).
		 * @returns {Promise<void>}
		 */
		push(remote?: string, branch?: string, options?: string[]): Promise<void>;

		/**
		 * Show the working tree status.
		 *
		 * @returns {Promise<StatusResult>} Parsed status result.
		 */
		status(): Promise<StatusResult>;

		/**
		 * Gets a list of tagged versions.
		 *
		 * @returns {Promise<TagResult>} Parsed tag list.
		 */
		tags(options?: string[]): Promise<TagResult>;
	}


	// responses
	// ---------------------
	interface PullResult extends resp.PullResult { }
	interface FetchResult extends resp.FetchResult { }
	interface StatusResult extends resp.StatusResult { }
	interface DiffResult extends resp.DiffResult { }
	interface TagResult extends resp.TagResult { }

}

export = simplegit;
