import { StringTask } from './task';
import { BranchSummary, parseBranchSummary } from '../responses/BranchSummary';
import {
   BranchDeletionBatchSummary,
   BranchDeletionSummary,
   parseBranchDeletions
} from '../responses/BranchDeleteSummary';

export function containsDeleteBranchCommand(commands: string[]) {
   const deleteCommands = ['-d', '-D', '--delete'];
   return commands.some(command => deleteCommands.includes(command));
}

export function branchTask(customArgs: string[]): StringTask<BranchSummary | BranchDeletionSummary> {
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
      parser (text: string) {
         return isDelete ? parseBranchDeletions(text).all[0] : parseBranchSummary(text);
      },
   }
}

export function branchLocalTask (): StringTask<BranchSummary> {
   return {
      format: 'utf-8',
      commands: ['branch', '-v'],
      parser (text: string) {
         return parseBranchSummary(text);
      },
   }
}

export function deleteBranchesTask (branches: string[], forceDelete = false): StringTask<BranchDeletionBatchSummary> {
   return {
      format: 'utf-8',
      commands: ['branch', '-v', forceDelete ? '-D' : '-d', ...branches],
      parser (text: string) {
         return parseBranchDeletions(text);
      },
      onError (exitCode, error, done, fail) {
         if (exitCode === 1 && /not fully merged/.test(error)) {
            return done(error);
         }

         fail(error);
      },
      concatStdErr: true,
   }
}

export function deleteBranchTask (branch: string, forceDelete = false): StringTask<BranchDeletionSummary> {
   return {
      format: 'utf-8',
      commands: ['branch', '-v', forceDelete ? '-D' : '-d', branch],
      parser (text: string) {
         return parseBranchDeletions(text).branches[branch]!;
      },
   }
}
