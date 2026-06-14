import { GitError } from './git-error';

/**
 * Raised by a plugin that refuses to spawn a command — for example the
 * deny-by-default environment and config-write guards. `plugin` names the
 * `SimpleGitOptions` field the caller would use to permit the operation.
 */
export class GitPluginError extends GitError {
   constructor(
      task: unknown,
      public readonly plugin: string,
      message?: string
   ) {
      super(task, message);
      Object.setPrototypeOf(this, new.target.prototype);
   }
}
