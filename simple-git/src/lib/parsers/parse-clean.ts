import type { CleanSummary } from '../../typings';
import { toLinesWithContent } from '../utils';

export class CleanResponse implements CleanSummary {
   public readonly paths: string[];
   public readonly files: string[];
   public readonly folders: string[];
   public readonly dryRun: boolean;

   constructor(dryRun: boolean) {
      this.paths = [];
      this.files = [];
      this.folders = [];
      this.dryRun = dryRun;
   }
}

const removalRegexp = /^[a-z]+\s*/i;
const dryRunRemovalRegexp = /^[a-z]+\s+[a-z]+\s*/i;
const isFolderRegexp = /\/$/;

export function cleanSummaryParser(dryRun: boolean, text: string): CleanSummary {
   const summary = new CleanResponse(dryRun);
   const regexp = dryRun ? dryRunRemovalRegexp : removalRegexp;

   toLinesWithContent(text).forEach((line) => {
      const removed = line.replace(regexp, '');

      summary.paths.push(removed);
      (isFolderRegexp.test(removed) ? summary.folders : summary.files).push(removed);
   });

   return summary;
}
