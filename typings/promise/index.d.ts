import * as resp from "../response";

declare function simplegit(basePath?: string): simplegit.SimpleGit;

declare namespace simplegit {

	interface SimpleGit {

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
	}


	// responses
	// ---------------------
	interface PullResult extends resp.PullResult { }
	interface FetchResult extends resp.FetchResult { }
	interface StatusResult extends resp.StatusResult { }
	interface DiffResult extends resp.DiffResult { }

}

export = simplegit;