import { BranchMultiDeleteResult } from '../../../typings';
import { BranchDeletionBatch, branchDeletionFailure, branchDeletionSuccess } from '../responses/BranchDeleteSummary';
import { ExitCodes, LineParser, parseStringResponse } from '../utils';
import { TaskParser } from '../tasks/task';

const deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;
const deleteErrorRegex = /^error[^']+'([^']+)'/m;

const parsers: LineParser<BranchMultiDeleteResult>[] = [
   new LineParser(deleteSuccessRegex, (result, [branch, hash]) => {
      const deletion = branchDeletionSuccess(branch, hash);

      result.all.push(deletion);
      result.branches[branch] = deletion;
   }),
   new LineParser(deleteErrorRegex, (result, [branch]) => {
      const deletion = branchDeletionFailure(branch);

      result.errors.push(deletion);
      result.all.push(deletion);
      result.branches[branch] = deletion;
   }),
];

export const parseBranchDeletions: TaskParser<string, BranchMultiDeleteResult> = (stdOut: string) => {
   return parseStringResponse(new BranchDeletionBatch(), parsers, stdOut);
}

export function hasBranchDeletionError(data: string, processExitCode: ExitCodes): boolean {
   return processExitCode === ExitCodes.ERROR && deleteErrorRegex.test(data);
}
