import { GitResponseError } from '../errors';
import { parseBranchSummary } from '../parsers/parse-branch';
import { hasBranchDeletionError, parseBranchDeletions } from '../parsers/parse-branch-delete';
import type {
   BranchMultiDeleteResult,
   BranchSingleDeleteResult,
   BranchSummary,
} from '../responses';
import type { StringTask } from '../types';
import { bufferToString, getTrailingOptions } from '../utils';

export function containsDeleteBranchCommand(commands: string[]): boolean {
   const deleteCommands = ['-d', '-D', '--delete'];
   return commands.some((command) => deleteCommands.includes(command));
}

export function branchTask(
   customArgs: string[]
): StringTask<BranchSummary | BranchSingleDeleteResult> {
   const isDelete = containsDeleteBranchCommand(customArgs);
   const isCurrentOnly = customArgs.includes('--show-current');

   const commands = ['branch', ...customArgs];

   if (commands.length === 1) {
      commands.push('-a');
   }

   if (!commands.includes('-v')) {
      commands.splice(1, 0, '-v');
   }

   return {
      format: 'utf-8',
      commands,
      parser(stdOut, stdErr) {
         if (isDelete) {
            return parseBranchDeletions(stdOut, stdErr).all[0];
         }

         return parseBranchSummary(stdOut, isCurrentOnly);
      },
   };
}

export function branchLocalTask(): StringTask<BranchSummary> {
   return {
      format: 'utf-8',
      commands: ['branch', '-v'],
      parser(stdOut) {
         return parseBranchSummary(stdOut);
      },
   };
}

export function deleteBranchesTask(
   branches: string[],
   forceDelete = false
): StringTask<BranchMultiDeleteResult> {
   return {
      format: 'utf-8',
      commands: ['branch', '-v', forceDelete ? '-D' : '-d', ...branches],
      parser(stdOut, stdErr) {
         return parseBranchDeletions(stdOut, stdErr);
      },
      onError({ exitCode, stdOut }, error, done, fail) {
         if (!hasBranchDeletionError(String(error), exitCode)) {
            return fail(error);
         }

         done(stdOut);
      },
   };
}

export function deleteBranchTask(
   branch: string,
   forceDelete = false
): StringTask<BranchSingleDeleteResult> {
   const task: StringTask<BranchSingleDeleteResult> = {
      format: 'utf-8',
      commands: ['branch', '-v', forceDelete ? '-D' : '-d', branch],
      parser(stdOut, stdErr) {
         return parseBranchDeletions(stdOut, stdErr).branches[branch]!;
      },
      onError({ exitCode, stdErr, stdOut }, error, _, fail) {
         if (!hasBranchDeletionError(String(error), exitCode)) {
            return fail(error);
         }

         throw new GitResponseError(
            task.parser(bufferToString(stdOut), bufferToString(stdErr)),
            String(error)
         );
      },
   };

   return task;
}

export function branch(...args: unknown[]): StringTask<BranchSummary> {
   // branchTask widens its response to include the delete-result shape for the
   // `-d`/`-D` case, but the public `branch()` surface is documented as
   // returning a BranchSummary (matching v3); deletions use deleteLocalBranch*
   return branchTask(getTrailingOptions(args)) as StringTask<BranchSummary>;
}

export function branchLocal(): StringTask<BranchSummary> {
   return branchLocalTask();
}

export function deleteLocalBranch(
   branchName: string,
   forceDelete?: boolean
): StringTask<BranchSingleDeleteResult> {
   return deleteBranchTask(branchName, typeof forceDelete === 'boolean' ? forceDelete : false);
}

export function deleteLocalBranches(
   branchNames: string[],
   forceDelete?: boolean
): StringTask<BranchMultiDeleteResult> {
   return deleteBranchesTask(branchNames, typeof forceDelete === 'boolean' ? forceDelete : false);
}
