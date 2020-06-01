import * as errors from './typings/errors';
import * as types from './typings/types';
import * as resp from './typings/response';
import * as simpleGit from './typings/simple-git';

declare const simplegit: simplegit.SimpleGitExport;

declare namespace simplegit {

   type SimpleGitExport = ((basePath?: string) => simplegit.SimpleGit) & {
      CleanOptions: typeof types.CleanOptions
   };

   type SimpleGit = simpleGit.SimpleGit;

   type Options = types.Options;

   type LogOptions<T = types.DefaultLogFields> = types.LogOptions<T>;

   // errors
   type GitError = errors.GitError;
   type GitResponseError<T> = errors.GitResponseError<T>;
   type TaskConfigurationError = errors.TaskConfigurationError;

   // responses
   // ---------------------
   type BranchSummary = types.BranchSummary

   type CleanSummary = types.CleanSummary;

   type CleanMode = types.CleanMode;

   type CommitSummary = resp.CommitSummary;

   type MergeSummary = resp.MergeSummary;

   type PullResult = resp.PullResult;

   type FetchResult = resp.FetchResult;

   type StatusResult = resp.StatusResult;

   type DiffResult = resp.DiffResult;

   type TagResult = resp.TagResult;

   type outputHandler = types.outputHandler

}

export = simplegit;
