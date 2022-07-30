import { DiffResult, DiffResultBinaryFile, DiffResultTextFile } from '../../../typings';

/***
 * The DiffSummary is returned as a response to getting `git().status()`
 */
export class DiffSummary implements DiffResult {
   changed = 0;
   deletions = 0;
   insertions = 0;

   files: Array<DiffResultTextFile | DiffResultBinaryFile> = [];
}
