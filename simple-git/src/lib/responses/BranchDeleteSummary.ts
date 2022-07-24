import {
   BranchMultiDeleteResult,
   BranchSingleDeleteFailure,
   BranchSingleDeleteResult,
   BranchSingleDeleteSuccess,
} from '../../../typings';

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
