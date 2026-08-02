import type { PullResult } from './PullSummary';

/**
 * Where the file was deleted, if there is a modify/delete conflict
 */
export interface MergeConflictDeletion {
   deleteRef: string;
}

/**
 * Represents a single file with conflicts in the MergeSummary
 */
export interface MergeConflict {
   /**
    * Type of conflict
    */
   reason: string;

   /**
    * Path to file
    */
   file: string | null;

   /**
    * Additional detail for the specific type of conflict
    */
   meta?: MergeConflictDeletion;
}

export type MergeResultStatus = 'success' | string;

export interface MergeDetail {
   conflicts: MergeConflict[];
   merges: string[];
   result: MergeResultStatus;
   readonly failed: boolean;
}

export type MergeResult = PullResult & MergeDetail;

export class MergeSummaryConflict implements MergeConflict {
   constructor(
      public readonly reason: string,
      public readonly file: string | null = null,
      public readonly meta: MergeConflictDeletion | undefined = undefined
   ) {}

   toString(): string {
      return `${this.file}:${this.reason}`;
   }
}

export class MergeSummaryDetail implements MergeDetail {
   public conflicts: MergeConflict[] = [];
   public merges: string[] = [];
   public result: MergeResultStatus = 'success';

   get failed(): boolean {
      return this.conflicts.length > 0;
   }

   get reason(): MergeResultStatus {
      return this.result;
   }

   toString(): string {
      if (this.conflicts.length) {
         return `CONFLICTS: ${this.conflicts.join(', ')}`;
      }

      return 'OK';
   }
}
