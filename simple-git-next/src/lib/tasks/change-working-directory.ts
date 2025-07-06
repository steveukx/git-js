import { folderExists } from '../utils';
import { SimpleGitExecutor } from '../types';
import { adhocExecTask } from './task';

export function changeWorkingDirectoryTask(directory: string, root?: SimpleGitExecutor) {
   return adhocExecTask((instance: SimpleGitExecutor) => {
      if (!folderExists(directory)) {
         throw new Error(`Git.cwd: cannot change to non-directory "${directory}"`);
      }

      return ((root || instance).cwd = directory);
   });
}
