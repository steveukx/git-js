import { SimpleGitTask } from './tasks/task';
import { GitError } from './errors/git-error';
import { NOOP } from './utils';
import { SimpleGitTaskCallback } from './types';

export function taskCallback<R>(task: SimpleGitTask<R>, response: Promise<R>, callback: SimpleGitTaskCallback<R> = NOOP) {

   const onSuccess = (data: R) => {
      callback(null, data);
   };

   const onError = (err: GitError) => {
      if (err?.task === task) {
         callback(err);
      }
   };

   response.then(onSuccess, onError);

}
