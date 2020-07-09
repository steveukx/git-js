import { MergeConflict, MergeConflictDeletion, MergeResult, MergeResultStatus } from '../../../typings';
import { parsePull, PullSummary } from './PullSummary';
import { ResponseLineResultMutator } from '../types';
import { forEachLineWithContent } from '../utils';

class MergeSummaryConflict implements MergeConflict {
   constructor(
      public readonly reason: string,
      public readonly file: string | null = null,
      public readonly meta?: MergeConflictDeletion,
   ) {
   }

   toString () {
      return `${this.file}:${this.reason}`;
   }
}

export class MergeSummaryResult extends PullSummary implements MergeResult {
   public conflicts: MergeConflict[] = [];
   public merges: string[] = [];
   public result: MergeResultStatus = 'success';

   get failed () {
      return this.conflicts.length > 0;
   }

   get reason () {
      return this.result;
   }

   toString () {
      if (this.conflicts.length) {
         return `CONFLICTS: ${this.conflicts.join(', ')}`;
      }

      return 'OK';
   }
}

const mutators: ResponseLineResultMutator<MergeResult>[] = [
   function autoMergeSuccess (result, line) {
      const match = /^Auto-merging\s+(.+)$/.exec(line);
      if (match) {
         result.merges.push(match[1]);
      }

      return !!match;
   },

   function mergeConflict (result, line) {
      const match = /^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/.exec(line);
      if (match) {
         result.conflicts.push(new MergeSummaryConflict(match[1], match[2]));
      }

      return !!match;
   },

   function modifyDeleteConflicts(result, line) {
      const match = /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/.exec(line);
      if (match) {
         result.conflicts.push(
            new MergeSummaryConflict(match[1], match[2], {deleteRef: match[3]})
         );
      }
      return !!match;
   },

   function otherConflicts (result, line) {
      const match = /^CONFLICT\s+\((.+)\):/.exec(line);
      if (match) {
         result.conflicts.push(new MergeSummaryConflict(match[1], null))
      }
      return !!match;
   },

   function autoMergeFailed (result, line) {
      const match = /^Automatic merge failed;\s+(.+)$/.exec(line);
      if (match) {
         result.result = match[1];
      }
      return !!match;
   },
];

export function parseMerge (text: string): MergeResult {
   const mergeSummary = new MergeSummaryResult();
   parsePull(text, mergeSummary);
   forEachLineWithContent(text, (line) => {
      mutators.some(mutator => mutator(mergeSummary, line));
   });
   return mergeSummary;
}
