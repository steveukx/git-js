import { BranchDeletionBatchSummary, BranchDeletionSummary } from '../../../typings/response';

export class BranchDeletionBatch implements BranchDeletionBatchSummary {
   all: BranchDeletionSummary[] = [];
   branches: {[branchName: string]: BranchDeletionSummary} = {};
   errors: BranchDeletionSummary[] = [];
   get success (): boolean {
      return !this.errors.length;
   }
}

export class BranchDeletion implements BranchDeletionSummary {
   public success: boolean;

   constructor(
      public branch: string,
      public hash: string | null,
   ) {
      this.success = hash !== null;
   }
}

export const deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;
export const deleteErrorRegex = /^error[^']+'([^']+)'/;

export const parseBranchDeletions = function (data: string): BranchDeletionBatch {
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
};

function toBranchDeletion(line: string) {
   const result = deleteSuccessRegex.exec(line) || deleteErrorRegex.exec(line);

   return result && new BranchDeletion(result[1], result.length > 1 && result[2] || null);
}
