export interface BranchSummaryBranch {
   current: boolean;
   name: string;
   commit: string;
   label: string;
   linkedWorkTree: boolean;
}

export interface BranchSummary {
   detached: boolean;
   current: string;
   all: string[];
   branches: {
      [key: string]: BranchSummaryBranch;
   };
}

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
   ): void {
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
