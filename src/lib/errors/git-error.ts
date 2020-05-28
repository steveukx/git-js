import { SimpleGitTask } from '../tasks/task';

export class GitError extends Error {

   constructor (
      public task?: SimpleGitTask<any>,
      message?: string,
   ) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
   }

}
