import { SimpleGit } from './simple-git';
import { exists, FOLDER } from './util/exists';
import { Runner } from './interfaces/command-runner';
import { defaultRunner } from './runners/default-runner';

export function git (baseDir?: string, handler?: Runner): SimpleGit {

   if (baseDir && !exists(baseDir, FOLDER)) {
      throw new Error("Cannot use simple-git on a directory that does not exist.");
   }

   return new SimpleGit(
      handler ||  defaultRunner(baseDir || process.cwd())
   );

}
