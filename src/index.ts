import { execP } from '@kwsites/exec-p';

import { Git } from './git';
import { Context } from './interfaces/context';
import { ContextModel } from './util/context';

export function simpleGit(baseDir?: string): Git {

   const context: Context = new ContextModel({
      exec(commands: string[]) {
         return execP(context.command, commands, {
            cwd: context.baseDir,
         });
      }
   });

   if (baseDir !== undefined) {
      context.baseDir = baseDir;
   }

   return new Git(context);

}
