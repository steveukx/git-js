
const SUMMARY_REGEX = /^Renaming (.+) to (.+)$/;

export interface MovedFile {
   from: string;
   to: string;
}

/**
 * The MoveSummary is returned as a response to getting `git().status()`
 *
 * @constructor
 */
export class MoveSummary {
   public moves: MovedFile[] = [];

   static parse (text: string): MoveSummary {
      const lines = text.trim().split('\n');
      const moveSummary = new MoveSummary();

      for (let i = 0, iMax = lines.length; i < iMax; i++) {
         const line = SUMMARY_REGEX.exec(lines[i].trim());

         if (line) {
            moveSummary.moves.push({
               from: line[1],
               to: line[2]
            });
         }
      }

      return moveSummary;
   }

}
