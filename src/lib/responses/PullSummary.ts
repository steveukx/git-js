import { PullDetailFileChanges, PullDetailSummary, PullResult } from '../../../typings';
import { append, LineParser, parseLinesWithContent } from '../utils';
import { TaskParser } from '../tasks/task';

export class PullSummary implements PullResult {
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
   new LineParser(ACTION_REGEX, (result, [action, file]) => {
      append(result.files, file);
      append((action === 'create') ? result.created : result.deleted, file);
   }),
];

export const parsePullResult: TaskParser<string, PullResult> = (stdOut, stdErr) => {
   return parseLinesWithContent(new PullSummary(), parsers, `${stdOut}\n${stdErr}`);
}
