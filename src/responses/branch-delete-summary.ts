
export class BranchDeletion {

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

export function branchDeleteParser (data: string): BranchDeletion[] {
   return data.trim().split('\n').reduce((deletions: BranchDeletion[], line: string) => {
         let result;
         if (result = deleteSuccessRegex.exec(line)) {
            deletions.push(new BranchDeletion(result[1], result[2]));
         }
         else if (result = deleteErrorRegex.exec(line)) {
            deletions.push(new BranchDeletion(result[1], null));
         }

         return deletions
      }, []);
}
