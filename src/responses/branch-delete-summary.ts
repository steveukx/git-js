
export class BranchDeletionSummary {

   public get success () {
      return this.hash !== null;
   }

   constructor (
      public branch: string,
      public hash: string | null,
   ) {}

}

export const deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;

export const deleteErrorRegex = /^error[^']+'([^']+)'/;

export function branchDeleteParser (data: string): BranchDeletionSummary[] {
   return data.trim().split('\n').reduce((deletions: BranchDeletionSummary[], line: string) => {
         let result;
         if (result = deleteSuccessRegex.exec(line)) {
            deletions.push(new BranchDeletionSummary(result[1], result[2]));
         }
         else if (result = deleteErrorRegex.exec(line)) {
            deletions.push(new BranchDeletionSummary(result[1], null));
         }

         return deletions
      }, []);
}
