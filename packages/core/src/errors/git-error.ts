export class GitError extends Error {
   constructor(
      public task?: unknown,
      message?: string
   ) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
   }
}
