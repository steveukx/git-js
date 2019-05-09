import { Context } from '../interfaces/context';
import { exists, FOLDER } from '../util/exists';

export async function construct(context: Context, baseDir = process.cwd()): Promise<Context> {

   if (baseDir && !exists(baseDir, FOLDER)) {
      throw new Error("Cannot use simple-git on a directory that does not exist.");
   }

   return {
      ...context,
      baseDir,
   }
}
