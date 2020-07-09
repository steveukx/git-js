import { PullResult } from '../../../typings';
import { forEachLineWithContent } from '../utils';
import { ResponseLineResultMutator } from '../types';

type PullResultFileChanges = { [fileName: string]: number };
type PullResultOverview = { changes: number; insertions: number; deletions: number };
type PullResultMutator = ResponseLineResultMutator<PullResult>;

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
const ACTION_REGEX = /(create|delete) mode \d+ (.+)/;

const mutateFileList: PullResultMutator = (result, line) =>{
   const [match, file, insertions, deletions] = FILE_UPDATE_REGEX.exec(line) || [];
   if (!match) {
      return false;
   }

   result.files.push(file);

   if (insertions) {
      result.insertions[file] = insertions.length;
   }

   if (deletions) {
      result.deletions[file] = deletions.length;
   }

   return true;
}

const mutateSummaryTotals: PullResultMutator = (result, line) => {
   if (!result.files.length) {
      return false;
   }

   const [match, changes, , insertions, , deletions] = SUMMARY_REGEX.exec(line) || [];
   if (!match || (insertions === undefined && deletions === undefined)) {
      return false;
   }

   result.summary.changes = +changes || 0;
   result.summary.insertions = +insertions || 0;
   result.summary.deletions = +deletions || 0;

   return true;
}

const mutateActions: PullResultMutator = (pullSummary, line) => {
   const match = ACTION_REGEX.exec(line);
   if (!match) {
      return false;
   }

   const [,action, file] = match;

   if (pullSummary.files.indexOf(file) < 0) {
      pullSummary.files.push(file);
   }

   ((action === 'create') ? pullSummary.created : pullSummary.deleted).push(file);

   return true;
}

const mutators: PullResultMutator[] = [
   mutateFileList,
   mutateSummaryTotals,
   mutateActions,
];

export function parsePull(text: string, pullSummary: PullResult = new PullSummary()): PullResult {
   forEachLineWithContent(text, (line) => {
      mutators.some(mutator => mutator(pullSummary, line));
   });
   return pullSummary;
}

