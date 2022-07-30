import {
   MergeConflict,
   MergeConflictDeletion,
   MergeDetail,
   MergeResultStatus,
} from '../../../typings';

export class MergeSummaryConflict implements MergeConflict {
   constructor(
      public readonly reason: string,
      public readonly file: string | null = null,
      public readonly meta?: MergeConflictDeletion
   ) {}

   toString() {
      return `${this.file}:${this.reason}`;
   }
}

export class MergeSummaryDetail implements MergeDetail {
   public conflicts: MergeConflict[] = [];
   public merges: string[] = [];
   public result: MergeResultStatus = 'success';

   get failed() {
      return this.conflicts.length > 0;
   }

   get reason() {
      return this.result;
   }

   toString() {
      if (this.conflicts.length) {
         return `CONFLICTS: ${this.conflicts.join(', ')}`;
      }

      return 'OK';
   }
}
