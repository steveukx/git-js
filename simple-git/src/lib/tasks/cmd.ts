import {
   GitTemplateError,
   isTemplateStringsArray,
   type TemplateArgvValue,
   templateArgv,
} from '@simple-git/argv-parser';

import type { StringTask } from '../types';
import { configurationErrorTask, type EmptyTask, straightThroughStringTask } from './task';

export type CmdTemplateValue = TemplateArgvValue;

export function cmdTask(
   strings: unknown,
   values: readonly unknown[]
): StringTask<string> | EmptyTask {
   if (!isTemplateStringsArray(strings)) {
      return configurationErrorTask(
         'git.cmd must be used as a tagged template literal, for example git.cmd`status`, use git.raw to supply an array of arguments'
      );
   }

   try {
      return straightThroughStringTask(templateArgv(strings, values));
   } catch (err) {
      if (err instanceof GitTemplateError) {
         return configurationErrorTask(`git.cmd: ${err.message}`);
      }
      throw err;
   }
}
