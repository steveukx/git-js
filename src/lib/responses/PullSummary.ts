import { PullResult } from '../../../typings';
import { append, LineParser, parseLinesWithContent } from '../utils';

type PullResultFileChanges = { [fileName: string]: number };
type PullResultOverview = { changes: number; insertions: number; deletions: number };

class PullSummaryTotals implements PullResultOverview {

   constructor(
      public changes = 0,
      public insertions = 0,
      public deletions = 0,
   ) {
   }

}

export class PullSummary implements PullResult {
   public created: string[] = [];
   public deleted: string[] = [];
   public files: string[] = [];
   public deletions: PullResultFileChanges = {};
   public insertions: PullResultFileChanges = {};
   public summary: PullResultOverview = new PullSummaryTotals();
}

const FILE_UPDATE_REGEX = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/;
const SUMMARY_REGEX = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/;
const ACTION_REGEX = /^(create|delete) mode \d+ (.+)/;

const parsers: LineParser<PullResult>[] = [
   new LineParser(FILE_UPDATE_REGEX, (result, [file, insertions, deletions]) => {
      result.files.push(file);

      if (insertions) {
         result.insertions[file] = insertions.length;
      }

      if (deletions) {
         result.deletions[file] = deletions.length;
      }
   }),
   new LineParser(SUMMARY_REGEX, (result, [changes, , insertions, , deletions]) => {
      if (insertions !== undefined || deletions !== undefined) {
         result.summary.changes = +changes || 0;
         result.summary.insertions = +insertions || 0;
         result.summary.deletions = +deletions || 0;
         return true;
      }
      return false;
   }),
   new LineParser(ACTION_REGEX, (summary, [action, file]) => {
      append(summary.files, file);
      append((action === 'create') ? summary.created : summary.deleted, file);
   }),
];

export function parsePull(text: string, pullSummary: PullResult = new PullSummary()): PullResult {
   return parseLinesWithContent(pullSummary, parsers, text);
}

