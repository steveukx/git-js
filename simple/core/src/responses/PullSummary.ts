import type { RemoteMessageResult } from '../parsers/parse-remote-messages';

export interface PullDetailFileChanges {
   [fileName: string]: number;
}

export interface PullDetailSummary {
   changes: number;
   insertions: number;
   deletions: number;
}

export interface PullDetail {
   /** Array of all files that are referenced in the pull */
   files: string[];

   /** Map of file names to the number of insertions in that file */
   insertions: PullDetailFileChanges;

   /** Map of file names to the number of deletions in that file */
   deletions: PullDetailFileChanges;

   summary: PullDetailSummary;

   /** Array of file names that have been created */
   created: string[];

   /** Array of file names that have been deleted */
   deleted: string[];
}

export interface PullResult extends PullDetail, RemoteMessageResult {}

/**
 * Wrapped with the `GitResponseError` as the exception thrown from a `git.pull` task
 * to provide additional detail as to what failed.
 */
export interface PullFailedResult {
   remote: string;
   hash: {
      local: string;
      remote: string;
   };
   branch: {
      local: string;
      remote: string;
   };
   message: string;
}

export class PullSummary implements PullResult {
   public remoteMessages: { all: string[] } = {
      all: [],
   };
   public created: string[] = [];
   public deleted: string[] = [];
   public files: string[] = [];
   public deletions: PullDetailFileChanges = {};
   public insertions: PullDetailFileChanges = {};
   public summary: PullDetailSummary = {
      changes: 0,
      deletions: 0,
      insertions: 0,
   };
}

export class PullFailedSummary implements PullFailedResult {
   remote = '';
   hash = {
      local: '',
      remote: '',
   };
   branch = {
      local: '',
      remote: '',
   };
   message = '';

   toString(): string {
      return this.message;
   }
}
