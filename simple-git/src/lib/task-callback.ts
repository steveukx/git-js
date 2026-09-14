import type { GitError } from './errors/git-error';
import type { GitResponseError } from './errors/git-response-error';
import type { SimpleGitTask, SimpleGitTaskCallback } from './types';
import { NOOP } from './utils';

export function taskCallback<R>(
   task: SimpleGitTask<R>,
   response: Promise<R>,
   callback: SimpleGitTaskCallback<R> = NOOP
) {
   const onSuccess = (data: R) => {
      callback(null, data);
   };

   const onError = (err: GitError | GitResponseError) => {
      if (err?.task === task) {
         callback(err, undefined as any);
      }
   };

   response.then(onSuccess, onError);
}
