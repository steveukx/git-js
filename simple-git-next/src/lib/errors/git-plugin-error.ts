import { SimpleGitOptions, SimpleGitTask } from '../types';
import { GitError } from './git-error';

export class GitPluginError extends GitError {
   constructor(
      public task?: SimpleGitTask<any>,
      public readonly plugin?: keyof SimpleGitOptions,
      message?: string
   ) {
      super(task, message);
      Object.setPrototypeOf(this, new.target.prototype);
   }
}
