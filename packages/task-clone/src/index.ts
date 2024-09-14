import {
   filterString,
   filterType,
   getTrailingOptions,
   trailingFunctionArgument,
} from 'simple-git/src/lib/utils';
import { SimpleGitTask, SimpleGitTaskCallback } from 'simple-git/src/lib/types';
import { SimpleGitApi } from 'simple-git/src/lib/simple-git-api';
import { configurationErrorTask } from 'simple-git/src/lib/tasks/task';
import { cloneMirrorTask, cloneTask } from 'simple-git/src/lib/tasks/clone';

export function clone(
   runTask: (task: SimpleGitTask<string>, then?: SimpleGitTaskCallback<string>) => SimpleGitApi
) {
   function getArgs(
      repoPath: string,
      localPath: string | unknown,
      args: IArguments
   ): Parameters<typeof cloneTask> {
      return [repoPath, filterType(localPath, filterString), getTrailingOptions(args)];
   }

   return {
      clone(repoPath: string, localPath?: string) {
         return runTask(
            validate('clone', repoPath) || cloneTask(...getArgs(repoPath, localPath, arguments)),
            trailingFunctionArgument(arguments)
         );
      },
      mirror(repoPath: string, localPath?: string) {
         return runTask(
            validate('mirror', repoPath) ||
               cloneMirrorTask(...getArgs(repoPath, localPath, arguments)),
            trailingFunctionArgument(arguments)
         );
      },
   };
}

function validate(api: string, repoPath: string | unknown) {
   if (typeof repoPath !== 'string') {
      return configurationErrorTask(`git.${api}() requires a string 'repoPath'`);
   }

   return undefined;
}
