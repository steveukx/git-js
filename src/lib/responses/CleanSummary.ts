import { toLinesWithContent } from '../utils/util';

export class CleanSummary {

   public paths: string[] = [];
   public files: string[] = [];
   public folders: string[] = [];

   constructor(
      public readonly dryRun: boolean,
   ) {}

}

const removalRegexp = /^[a-z]+\s*/i;
const dryRunRemovalRegexp = /^[a-z]+\s+[a-z]+\s*/i;
const isFolderRegexp = /\/$/;

export function cleanSummaryParser (dryRun: boolean, text: string): CleanSummary {
   const summary = new CleanSummary(dryRun);
   const regexp = dryRun ? dryRunRemovalRegexp : removalRegexp;

   toLinesWithContent(text, true).forEach(line => {
      const removed = line.replace(regexp, '');

      summary.paths.push(removed);
      (isFolderRegexp.test(removed) ? summary.folders : summary.files).push(removed);
   });

   return summary;
}
