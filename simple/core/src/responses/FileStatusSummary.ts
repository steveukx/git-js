/**
 * Represents file name changes in a StatusResult
 */
export interface StatusResultRenamed {
   from: string;
   to: string;
}

export interface FileStatusResult {
   /** Original location of the file, when the file has been moved */
   from?: string;

   /** Path of the file */
   path: string;

   /** First digit of the status code of the file, e.g. 'M' = modified.
    Represents the status of the index if no merge conflicts, otherwise represents
    status of one side of the merge. */
   index: string;

   /** Second digit of the status code of the file. Represents status of the working directory
    if no merge conflicts, otherwise represents status of other side of a merge.
    See https://git-scm.com/docs/git-status#_short_format for full documentation of possible
    values and their meanings. */
   working_dir: string;
}

export const fromPathRegex: RegExp = /^(.+)\0(.+)$/;

export class FileStatusSummary implements FileStatusResult {
   public readonly from: string | undefined;

   constructor(
      public path: string,
      public index: string,
      public working_dir: string
   ) {
      if (index === 'R' || working_dir === 'R') {
         const detail = fromPathRegex.exec(path) || [null, path, path];
         this.from = detail[2] || '';
         this.path = detail[1] || '';
      }
   }
}
