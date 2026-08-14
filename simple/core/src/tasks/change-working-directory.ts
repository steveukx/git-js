import type { SimpleGitExecutor } from '../types';
import { folderExists } from '../utils';
import { adhocExecTask, type EmptyTask } from './task';

export function changeWorkingDirectoryTask(directory: string, root?: SimpleGitExecutor): EmptyTask {
   return adhocExecTask((instance: SimpleGitExecutor) => {
      if (!folderExists(directory)) {
         throw new Error(`Git.cwd: cannot change to non-directory "${directory}"`);
      }

      return ((root || instance).cwd = directory);
   });
}
