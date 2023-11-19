import { Response, SimpleGit } from '../../../typings';
import { SimpleGitApi } from '../simple-git-api';

export default function (): Pick<SimpleGit, 'firstCommit'> {
   return {
      firstCommit(this: SimpleGitApi): Response<string> {
         return this._runTask({
            commands: ['rev-list', '--max-parents=0', 'HEAD'],
            format: 'utf-8',
            parser(stdOut) {
               return String(stdOut).trim();
            },
         });
      },
   };
}
