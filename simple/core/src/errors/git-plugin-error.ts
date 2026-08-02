import type { GitTask } from '../tasks';
import type { SimpleGitCoreOptions } from '../types';
import { GitError } from './git-error';

export class GitPluginError extends GitError {
   constructor(
      public readonly task: GitTask<unknown> | undefined = undefined,
      public readonly plugin: keyof SimpleGitCoreOptions | undefined = undefined,
      message?: string
   ) {
      super(task, message);
      Object.setPrototypeOf(this, new.target.prototype);
   }
}
