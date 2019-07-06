import { Context } from '../interfaces/context';
import { ApiOptions } from '../interfaces/api-options';
import { optionsToCommandArray } from '../util/options';
import { arrayContains } from '../util/array';
import { BranchDeleteResponse, BranchResponse } from '../responses';

export async function branch(context: Context, options: ApiOptions): Promise<BranchDeleteResponse[] | BranchResponse> {

   const command: string[] = ['branch', ...optionsToCommandArray(options)];
   const isDelete: boolean = arrayContains(command, '-d', '-D', '--delete');

   if (!arrayContains(command, '-v')) {
      command.splice(1, 0, '-v');
   }

   const output = await context.exec(command);
   return isDelete
      ? BranchDeleteResponse.parse(output)
      : BranchResponse.parse(output);

}

export async function branchLocal (context: Context): Promise<BranchResponse> {
   return BranchResponse.parse(
      await context.exec(['branch', '-v'])
   );
}

/**
 * Delete a local branch
 */
export async function deleteLocalBranch (context: Context, branches: string[], forceDelete: boolean): Promise<BranchDeleteResponse[]> {
   const operator: string = forceDelete ? '-D' : '-d';

   return BranchDeleteResponse.parse(
      await context.exec(['branch', operator, ...branches])
   );
}
