import dependencies from '../util/dependencies';
import { SimpleGit } from '../simple-git';


export const simpleGitBuilder = (baseDir?: string): SimpleGit => {
   if (baseDir && !dependencies.isValidDirectory(baseDir)) {
      throw new Error('Cannot use simple-git on a directory that does not exist.');
   }

   return new SimpleGit(baseDir || process.cwd());
};

