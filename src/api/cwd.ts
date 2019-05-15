import { Context } from '../interfaces/context';
import { exists, FOLDER } from '../util/exists';

/**
 * Sets the working directory of the subsequent commands.
 */
export async function cwd (context: Context, baseDir: string): Promise<Context> {

   if (baseDir && !exists(baseDir, FOLDER)) {
      throw new Error(`Git.cwd: cannot change to non-directory "${ baseDir }"`);
   }

   return {
      ...context,
      baseDir,
   };

}
