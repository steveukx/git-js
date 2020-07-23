import { BranchSummary, BranchSummaryBranch } from '../../../typings';

export class BranchSummaryResult implements BranchSummary {
   public all: string[] = [];
   public branches: { [p: string]: BranchSummaryBranch } = {};
   public current: string = '';
   public detached: boolean = false;

   push(current: boolean, detached: boolean, name: string, commit: string, label: string) {
      if (current) {
         this.detached = detached;
         this.current = name;
      }

      this.all.push(name);
      this.branches[name] = {
         current: current,
         name: name,
         commit: commit,
         label: label
      };
   }
}

