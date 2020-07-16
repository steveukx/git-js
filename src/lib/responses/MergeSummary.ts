import { MergeConflict, MergeConflictDeletion, MergeResult, MergeResultStatus } from '../../../typings';
import { parsePull, PullSummary } from './PullSummary';
import { LineParser, parseLinesWithContent } from '../utils';

class MergeSummaryConflict implements MergeConflict {
   constructor(
      public readonly reason: string,
      public readonly file: string | null = null,
      public readonly meta?: MergeConflictDeletion,
   ) {
   }

   toString() {
      return `${this.file}:${this.reason}`;
   }
}

export class MergeSummaryResult extends PullSummary implements MergeResult {
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


const parsers: LineParser<MergeResult>[] = [
   new LineParser(/^Auto-merging\s+(.+)$/, (summary, [autoMerge]) => {
      summary.merges.push(autoMerge);
   }),
   new LineParser(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (summary, [reason, file]) => {
      summary.conflicts.push(new MergeSummaryConflict(reason, file));
   }),
   new LineParser(/^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/, (summary, [reason, file, deleteRef]) => {
      summary.conflicts.push(new MergeSummaryConflict(reason, file, {deleteRef}));
   }),
   new LineParser(/^CONFLICT\s+\((.+)\):/, (summary, [reason]) => {
      summary.conflicts.push(new MergeSummaryConflict(reason, null));
   }),
   new LineParser(/^Automatic merge failed;\s+(.+)$/, (summary, [result]) => {
      summary.result = result;
   }),
];

export function parseMerge(text: string): MergeResult {
   const mergeSummary = new MergeSummaryResult();
   parsePull(text, mergeSummary);
   parseLinesWithContent(mergeSummary, parsers, text);
   return mergeSummary;
}
