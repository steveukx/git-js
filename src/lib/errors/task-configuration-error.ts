import { GitError } from './git-error';

export class TaskConfigurationError extends GitError {

   constructor (
      message?: string,
   ) {
      super(undefined, message);
   }

}
