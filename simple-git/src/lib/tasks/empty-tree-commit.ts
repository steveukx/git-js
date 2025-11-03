import { Response, SimpleGit } from '../../../typings';
import { SimpleGitApi } from '../simple-git-api';
import { trailingFunctionArgument } from '../utils';
import { straightThroughStringTask } from './task';

export default function (): Pick<SimpleGit, 'emptyTreeCommit'> {
   return {
      emptyTreeCommit(this: SimpleGitApi): Response<string> {
         return this._runTask(
            straightThroughStringTask(['hash-object', '-t', 'tree', '/dev/null'], true),
            trailingFunctionArgument(arguments)
         );
      },
   };
}
