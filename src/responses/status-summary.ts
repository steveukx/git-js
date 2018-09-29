/**
 * The StatusSummary is returned as a response to getting `git().status()`
 *
 * @constructor
 */
import { FileStatusSummary } from './file-status-summary';

type NullableString = string | null;

interface StatusSummaryLineParser {
   (line: string, status: StatusSummary, indexState: any): void;
}

export class StatusSummary {

   public not_added: string[] = [];
   public conflicted: string[] = [];
   public created: string[] = [];
   public deleted: string[] = [];
   public modified: string[] = [];
   public renamed: Array<{ from: string, to: string }> = [];

   /**
    * All files represented as an array of objects containing the `path` and status in `index` and
    * in the `working_dir`.
    *
    * @type {Array}
    */
   public files: FileStatusSummary[] = [];

   public staged: string[] = [];

   /**
    * Number of commits ahead of the tracked branch
    * @type {number}
    */
   public ahead = 0;

   /**
    * Number of commits behind the tracked branch
    * @type {number}
    */
   public behind = 0;

   /**
    * Name of the current branch
    * @type {null}
    */
   public current: NullableString = null;

   /**
    * Name of the branch being tracked
    * @type {string}
    */
   public tracking: NullableString = null;

   /**
    * Gets whether this StatusSummary represents a clean working branch.
    *
    * @return {boolean}
    */
   isClean() {
      return 0 === this.files.length;
   }

   static parse(text: string): StatusSummary {
      const lines = text.trim().split('\n');
      const status = new StatusSummary();

      for (let i = 0, max = lines.length; i < max; i++) {
         let file = splitLine(lines[i]);

         if (!file) {
            continue;
         }

         if (file.handler) {
            file.handler(file.path, status, file.index);
         }

         if (file.code !== '##') {
            status.files.push(new FileStatusSummary(file.path, file.index, file.workingDir));
         }
      }

      return status;
   };
}

const parsers: { [key: string]: StatusSummaryLineParser } = {
   '##'(line, status) {
      const aheadReg = /ahead (\d+)/;
      const behindReg = /behind (\d+)/;
      const currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
      const trackingReg = /\.{3}(\S*)/;
      let regexResult;

      regexResult = aheadReg.exec(line);
      status.ahead = regexResult && +regexResult[1] || 0;

      regexResult = behindReg.exec(line);
      status.behind = regexResult && +regexResult[1] || 0;

      regexResult = currentReg.exec(line);
      status.current = regexResult && regexResult[1];

      regexResult = trackingReg.exec(line);
      status.tracking = regexResult && regexResult[1];
   },

   '??'(line, status) {
      status.not_added.push(line);
   },

   A(line, status) {
      status.created.push(line);
   },

   AM(line, status) {
      status.created.push(line);
   },

   D(line, status) {
      status.deleted.push(line);
   },

   M(line, status, indexState) {
      status.modified.push(line);

      if (indexState === 'M') {
         status.staged.push(line);
      }
   },

   MM(line, status, indexState) {
      return parsers.M(line, status, indexState);
   },

   R(line, status) {
      const [, from, to] = /^(.+) -> (.+)$/.exec(line) || [null, line, line];

      status.renamed.push({
         from,
         to
      });
   },

   UU: function (line, status) {
      status.conflicted.push(line);
   }
};


function splitLine(lineStr: string) {
   let line = lineStr.trim().match(/(..?)(\s+)(.*)/);
   if (!line || !line[1].trim()) {
      line = lineStr.trim().match(/(..?)\s+(.*)/);
   }

   if (!line) {
      return;
   }

   let code = line[1];
   if (line[2].length > 1) {
      code += ' ';
   }
   if (code.length === 1 && line[2].length === 1) {
      code = ' ' + code;
   }

   return {
      raw: code,
      code: code.trim(),
      index: code.charAt(0),
      workingDir: code.charAt(1),
      handler: parsers[code.trim()],
      path: line[3]
   };
}
