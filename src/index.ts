import dependencies from './util/dependencies';
import { SimpleGit } from './simpleGit';

const simpleGitGenerator = (baseDir?: string) => {
   if (baseDir && !dependencies.isValidDirectory(baseDir)) {
      throw new Error('Cannot use simple-git on a directory that does not exist.');
   }

   return new SimpleGit(baseDir || process.cwd());
};

module.exports = simpleGitGenerator;

