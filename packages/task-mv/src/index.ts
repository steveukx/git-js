import { moveTask } from 'simple-git/src/lib/tasks/move';
import { trailingFunctionArgument } from 'simple-git/src/lib/utils';
import { SimpleGitTask, SimpleGitTaskCallback } from 'simple-git/src/lib/types';
import { MoveResult } from 'simple-git';
import { SimpleGitApi } from 'simple-git/src/lib/simple-git-api';

export function mv(
   runTask: (
      task: SimpleGitTask<MoveResult>,
      then?: SimpleGitTaskCallback<MoveResult>
   ) => SimpleGitApi
) {
   return {
      mv(from: string | string[], to: string) {
         return runTask(moveTask(from, to), trailingFunctionArgument(arguments));
      },
   };
}
