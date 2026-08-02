/**
 * Represents the successful deletion of a single branch
 */
export interface BranchSingleDeleteSuccess {
   branch: string;
   hash: string;
   success: true;
}

/**
 * Represents the failure to delete a single branch
 */
export interface BranchSingleDeleteFailure {
   branch: string;
   hash: null;
   success: false;
}

export type BranchSingleDeleteResult = BranchSingleDeleteFailure | BranchSingleDeleteSuccess;

/**
 * Represents the status of having deleted a batch of branches
 */
export interface BranchMultiDeleteResult {
   /**
    * All branches included in the response
    */
   all: BranchSingleDeleteResult[];

   /**
    * Branches mapped by their branch name
    */
   branches: { [branchName: string]: BranchSingleDeleteResult };

   /**
    * Array of responses that are in error
    */
   errors: BranchSingleDeleteResult[];

   /**
    * Flag showing whether all branches were deleted successfully
    */
   readonly success: boolean;
}

export class BranchDeletionBatch implements BranchMultiDeleteResult {
   all: BranchSingleDeleteResult[] = [];
   branches: { [branchName: string]: BranchSingleDeleteResult } = {};
   errors: BranchSingleDeleteResult[] = [];

   get success(): boolean {
      return !this.errors.length;
   }
}

export function branchDeletionSuccess(branch: string, hash: string): BranchSingleDeleteSuccess {
   return {
      branch,
      hash,
      success: true,
   };
}

export function branchDeletionFailure(branch: string): BranchSingleDeleteFailure {
   return {
      branch,
      hash: null,
      success: false,
   };
}

export function isSingleBranchDeleteFailure(
   test: BranchSingleDeleteResult
): test is BranchSingleDeleteSuccess {
   return test.success;
}
