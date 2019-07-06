
export const deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;

export const deleteErrorRegex = /^error[^']+'([^']+)'/;

export class BranchDeleteResponse {

   public readonly success: boolean = this.hash !== null;

   constructor (
      public branch: string,
      public hash: string | null,
   ) {}

   static parse (data: string): BranchDeleteResponse[] {
      const branchDeleteResponses: BranchDeleteResponse[] = [];

      data
         .split('\n')
         .forEach((row: string) => {
            const line = row.trim();

            if (!line) {
               return;
            }

            let result;

            if (result = deleteSuccessRegex.exec(line)) {
               return branchDeleteResponses.push(
                  new BranchDeleteResponse(result[1], result[2]));
            }

            if (result = deleteErrorRegex.exec(line)) {
               return branchDeleteResponses.push(
                  new BranchDeleteResponse(result[1], null));
            }
         });

      return branchDeleteResponses;
   }

}


