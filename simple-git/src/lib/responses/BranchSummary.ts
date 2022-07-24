import type { BranchSummary, BranchSummaryBranch } from '../../../typings';

export enum BranchStatusIdentifier {
   CURRENT = '*',
   LINKED = '+',
}

export class BranchSummaryResult implements BranchSummary {
   public all: string[] = [];
   public branches: { [p: string]: BranchSummaryBranch } = {};
   public current: string = '';
   public detached: boolean = false;

   push(
      status: BranchStatusIdentifier | unknown,
      detached: boolean,
      name: string,
      commit: string,
      label: string
   ) {
      if (status === BranchStatusIdentifier.CURRENT) {
         this.detached = detached;
         this.current = name;
      }

      this.all.push(name);
      this.branches[name] = {
         current: status === BranchStatusIdentifier.CURRENT,
         linkedWorkTree: status === BranchStatusIdentifier.LINKED,
         name,
         commit,
         label,
      };
   }
}
