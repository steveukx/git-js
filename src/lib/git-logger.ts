/**
 * The `GitLogger` is used by the main `SimpleGit` runner to handle logging
 * any warnings or errors.
 */
export class GitLogger {

   constructor(private _silentLogging: boolean) {
   }

   silent (silence = false) {
      this._silentLogging = silence;
   }

   error (message: string) {
      if (!this._silentLogging) {
         console.error(message);
      }
   }

   warn (message: string) {
      if (!this._silentLogging) {
         console.warn(message);
      }
   }

}
