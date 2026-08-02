import type { DiffNameStatus } from '../tasks/diff-name-status';

export interface DiffResultTextFile {
   file: string;
   changes: number;
   insertions: number;
   deletions: number;
   binary: false;
}

export interface DiffResultBinaryFile {
   file: string;
   before: number;
   after: number;
   binary: true;
}

/** `--name-status` argument needed */
export interface DiffResultNameStatusFile extends DiffResultTextFile {
   status?: DiffNameStatus;
   from?: string;
   similarity: number;
}

export interface DiffResult {
   /** The total number of files changed as reported in the summary line */
   changed: number;

   /** When present in the diff, lists the details of each file changed */
   files: Array<DiffResultTextFile | DiffResultBinaryFile | DiffResultNameStatusFile>;

   /** The number of files changed with insertions */
   insertions: number;

   /** The number of files changed with deletions */
   deletions: number;
}

/***
 * The DiffSummary is returned as a response to getting `git().status()`
 */
export class DiffSummary implements DiffResult {
   changed = 0;
   deletions = 0;
   insertions = 0;

   files: Array<DiffResultTextFile | DiffResultBinaryFile> = [];
}
