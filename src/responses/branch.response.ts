
export interface BranchDetail {
   [name: string]: {
      current: boolean;
      name: string;
      commit: string;
      label: string;
   }
}

export const detachedRegex = /^(\*?\s+)\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/;

export const branchRegex = /^(\*?\s+)(\S+)\s+([a-z0-9]+)\s(.*)$/;

export class BranchResponse {

   public all: string[] = [];
   public branches: BranchDetail = {};
   public current = '';
   public detached = false;

   push (current: boolean, detached: boolean, name: string, commit: string, label: string) {
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

   static parse (data: string): BranchResponse {
         const branchSummary = new BranchResponse();

         data
            .split('\n')
            .forEach((line: string) => {
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
   }

}

