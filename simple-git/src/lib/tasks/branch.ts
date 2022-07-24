import { BranchMultiDeleteResult, BranchSingleDeleteResult, BranchSummary } from '../../../typings';
import { StringTask } from '../types';
import { GitResponseError } from '../errors/git-response-error';
import { hasBranchDeletionError, parseBranchDeletions } from '../parsers/parse-branch-delete';
import { parseBranchSummary } from '../parsers/parse-branch';
import { bufferToString } from '../utils';

export function containsDeleteBranchCommand(commands: string[]) {
   const deleteCommands = ['-d', '-D', '--delete'];
   return commands.some((command) => deleteCommands.includes(command));
}

export function branchTask(
   customArgs: string[]
): StringTask<BranchSummary | BranchSingleDeleteResult> {
   const isDelete = containsDeleteBranchCommand(customArgs);
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

         return parseBranchSummary(stdOut);
      },
   };
}

export function branchLocalTask(): StringTask<BranchSummary> {
   const parser = parseBranchSummary;

   return {
      format: 'utf-8',
      commands: ['branch', '-v'],
      parser,
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
