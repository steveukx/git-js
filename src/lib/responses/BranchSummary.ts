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

export const detachedRegex = /^(\*?\s+)\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/;
export const branchRegex = /^(\*?\s+)(\S+)\s+([a-z0-9]+)\s(.*)$/;

export const parseBranchSummary = function (commit: string): BranchSummary {
   const branchSummary = new BranchSummaryResult();

   commit.split('\n')
      .forEach(function (line) {
         let detached = true;
         let branch = detachedRegex.exec(line);

         if (!branch) {
            detached = false;
            branch = branchRegex.exec(line);
         }

         if (branch) {
            branchSummary.push(
               branch[1].charAt(0) === '*',
               detached,
               branch[2],
               branch[3],
               branch[4]
            );
         }
      });

   return branchSummary;
};
