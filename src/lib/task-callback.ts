import { SimpleGitTask } from './tasks/task';
import { GitError } from './git-error';
import { NOOP } from './util';

export type SimpleGitTaskErrorCallback = (error: Error) => void;
export type SimpleGitTaskSuccessCallback<R> = (error: null, response: R) => void;

export type SimpleGitTaskCallback<R> = SimpleGitTaskErrorCallback & SimpleGitTaskSuccessCallback<R>;

export function taskCallback<R> (task: SimpleGitTask<R>, response: Promise<R>, callback: SimpleGitTaskCallback<R> = NOOP) {

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
