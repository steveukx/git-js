/**
 * Exports the utilities `simple-git` depends upon to allow for mocking during a test
 */
import { exists, FOLDER } from '@kwsites/file-exists';

const dependencies = {

   buffer () {
      return require('buffer').Buffer;
   },

   childProcess() {
      return require('child_process');
   },

   isValidDirectory(path: string): boolean {
      return exists(path, FOLDER);
   }

};

export default dependencies;
