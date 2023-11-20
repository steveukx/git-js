import { Response, SimpleGit } from '../../../typings';
import { SimpleGitApi } from '../simple-git-api';
import { trailingFunctionArgument } from '../utils';
import { straightThroughStringTask } from './task';

export default function (): Pick<SimpleGit, 'firstCommit'> {
   return {
      firstCommit(this: SimpleGitApi): Response<string> {
         return this._runTask(
            straightThroughStringTask(['rev-list', '--max-parents=0', 'HEAD'], true),
            trailingFunctionArgument(arguments)
         );
      },
   };
}
