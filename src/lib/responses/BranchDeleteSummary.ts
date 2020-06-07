import { ExitCodes } from '../utils';

/**
 * Represents the status of a single branch deletion
 */
export interface BranchDeletionSummary {
   branch: string;
   hash: string | null;
   readonly success: boolean;
}

/**
 * Represents the status of having deleted a batch of branches
 */
export interface BranchDeletionBatchSummary {
   /**
    * All branches included in the response
    */
   all: BranchDeletionSummary[];

   /**
    * Branches mapped by their branch name
    */
   branches: { [branchName: string]: BranchDeletionSummary };

   /**
    * Array of responses that are in error
    */
   errors: BranchDeletionSummary[];

   /**
    * Flag showing whether all branches were deleted successfully
    */
   readonly success: boolean;
}

export class BranchDeletionBatch implements BranchDeletionBatchSummary {
   all: BranchDeletionSummary[] = [];
   branches: { [branchName: string]: BranchDeletionSummary } = {};
   errors: BranchDeletionSummary[] = [];

   get success(): boolean {
      return !this.errors.length;
   }
}

export class BranchDeletion implements BranchDeletionSummary {

   constructor(
      public branch: string,
      public hash: string | null,
   ) {}

   get success(): boolean {
      return this.hash !== null;
   }
}

export const deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;
export const deleteErrorRegex = /^error[^']+'([^']+)'/m;

export function hasBranchDeletionError(data: string, processExitCode: number = ExitCodes.ERROR): boolean {
   return deleteErrorRegex.test(data) && processExitCode === ExitCodes.ERROR;
}

export function parseBranchDeletions(data: string): BranchDeletionBatch {
   const batch = new BranchDeletionBatch();
   data.trim().split('\n').forEach((line: string) => {
      const deletion = toBranchDeletion(line);
      if (!deletion) {
         return;
      }

      batch.all.push(batch.branches[deletion.branch] = deletion);
      if (!deletion.success) {
         batch.errors.push(deletion);
      }
   });

   return batch;
}

function toBranchDeletion(line: string) {
   const result = deleteSuccessRegex.exec(line) || deleteErrorRegex.exec(line);

   return result && new BranchDeletion(result[1], result.length > 1 && result[2] || null);
}
