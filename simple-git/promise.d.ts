import * as SimpleGitTypes from 'simple-git';

/**
 * @deprecated
 *
 * simple-git has supported promises / async await since version 2.6.0.
 * Importing from 'simple-git/promise' has been deprecated and will be
 * removed by July 2022.
 *
 * To upgrade, change all 'simple-git/promise' imports to just 'simple-git'
 */
declare const simplegit: simplegit.SimpleGitExport;

declare namespace simplegit {

   type SimpleGitExport = ((basePath?: string) => simplegit.SimpleGit) & {
      CleanOptions: typeof SimpleGitTypes.CleanOptions
   };

   /**
    * @deprecated
    *
    * simple-git has supported promises / async await since version 2.6.0.
    * Importing from 'simple-git/promise' has been deprecated and will be
    * removed by July 2022.
    *
    * To upgrade, change all 'simple-git/promise' imports to just 'simple-git'
    */
   type SimpleGit = SimpleGitTypes.SimpleGit;

   // errors
   type GitError = SimpleGitTypes.GitError;
   type GitConstructError = SimpleGitTypes.GitConstructError;
   type GitResponseError<T> = SimpleGitTypes.GitResponseError<T>;
   type TaskConfigurationError = SimpleGitTypes.TaskConfigurationError;

   // responses
   type BranchSummary = SimpleGitTypes.BranchSummary
   type CleanSummary = SimpleGitTypes.CleanSummary;
   type CleanMode = SimpleGitTypes.CleanMode;
   type DiffResult = SimpleGitTypes.DiffResult;
   type FetchResult = SimpleGitTypes.FetchResult;
   type CommitResult = SimpleGitTypes.CommitResult;
   type MergeResult = SimpleGitTypes.MergeResult;
   type PullResult = SimpleGitTypes.PullResult;
   type StatusResult = SimpleGitTypes.StatusResult;
   type TagResult = SimpleGitTypes.TagResult;

   // types
   type outputHandler = SimpleGitTypes.outputHandler
   type LogOptions<T = SimpleGitTypes.DefaultLogFields> = SimpleGitTypes.LogOptions<T>;
   type Options = SimpleGitTypes.Options;

   // deprecated
   /** @deprecated use MergeResult */
   type MergeSummary = SimpleGitTypes.MergeSummary;
   /** @deprecated use CommitResult */
   type CommitSummary = SimpleGitTypes.CommitResult;
}

/**
 * @deprecated
 *
 * simple-git has supported promises / async await since version 2.6.0.
 * Importing from 'simple-git/promise' has been deprecated and will be
 * removed by July 2022.
 *
 * To upgrade, change all 'simple-git/promise' imports to just 'simple-git'
 */
export = simplegit;
