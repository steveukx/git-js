import type { SimpleGit } from '../../typings';
import type { SimpleGitApi } from '../simple-git-api';
import type { StringTask } from '../types';
import {
   asCamelCase,
   filterStringOrBuffer,
   filterType,
   forEachLineWithContent,
   trailingFunctionArgument,
} from '../utils';
import { configurationErrorTask, type EmptyTask } from './task';

function interpretTrailersTask(
   input?: string | Buffer
): StringTask<Record<string, string>> | EmptyTask {
   if (input === undefined) {
      return configurationErrorTask(`interpretTrailers called without input content`);
   }

   return {
      format: 'utf-8',
      parser(stdOut) {
         return Object.fromEntries(
            forEachLineWithContent(stdOut, (line) => {
               const index = line.indexOf(':');
               return [
                  asCamelCase(line.substring(0, index).toLowerCase()),
                  line.substring(index + 2).trim(),
               ];
            })
         );
      },
      commands: ['interpret-trailers', '--parse'],
      input,
   };
}

export default function (): Pick<SimpleGit, 'interpretTrailers'> {
   return {
      interpretTrailers(this: SimpleGitApi, input) {
         return this._runTask(
            interpretTrailersTask(filterType(input, filterStringOrBuffer)),
            trailingFunctionArgument(arguments)
         );
      },
   };
}
