import { GitError } from './errors/git-error';
import { GitResponseError } from './errors/git-response-error';
import { SimpleGitTask, SimpleGitTaskCallback } from './types';
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
         callback(
            err instanceof GitResponseError ? addDeprecationNoticeToError(err) : err,
            undefined as any
         );
      }
   };

   response.then(onSuccess, onError);
}

function addDeprecationNoticeToError(err: GitResponseError) {
   let log = (name: string) => {
      console.warn(
         `simple-git deprecation notice: accessing GitResponseError.${name} should be GitResponseError.git.${name}, this will no longer be available in version 3`
      );
      log = NOOP;
   };

   return Object.create(err, Object.getOwnPropertyNames(err.git).reduce(descriptorReducer, {}));

   function descriptorReducer(all: PropertyDescriptorMap, name: string): typeof all {
      if (name in err) {
         return all;
      }

      all[name] = {
         enumerable: false,
         configurable: false,
         get() {
            log(name);
            return err.git[name];
         },
      };

      return all;
   }
}
