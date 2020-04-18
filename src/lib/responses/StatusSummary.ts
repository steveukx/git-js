import { FileStatusSummary } from './FileStatusSummary';

/**
 * The StatusSummary is returned as a response to getting `git().status()`
 *
 * @constructor
 */
export class StatusSummary {
   public not_added: string[] = [];
   public conflicted: string[] = [];
   public created: string[] = [];
   public deleted: string[] = [];
   public modified: string[] = [];
   public renamed: Array<{from: string, to: string}> = [];

   /**
    * All files represented as an array of objects containing the `path` and status in `index` and
    * in the `working_dir`.
    */
   public files: FileStatusSummary[] = [];
   public staged: string[] = [];

   /**
    * Number of commits ahead of the tracked branch
    */
   public ahead: number = 0;

   /**
    *Number of commits behind the tracked branch
    */
   public behind: number = 0;

   /**
    * Name of the current branch
    */
   public current: string | null = null;

   /**
    * Name of the branch being tracked
    */
   public tracking: string | null = null;

   /**
    * Gets whether this StatusSummary represents a clean working branch.
    */
   public isClean (): boolean {
      for (const property in this) {
         if (this.hasOwnProperty(property) && Array.isArray(property) && (this[property] as any).length > 0) {
            return false;
         }
      }

      return true;
   }
}

export type StatusSummaryParserFn = {
   (line: string, status: StatusSummary, indexState: string, workingDir: string): void;
}

export const StatusSummaryParsers: {[key: string]: StatusSummaryParserFn} = {
   '##': function (line, status) {
      var aheadReg = /ahead (\d+)/;
      var behindReg = /behind (\d+)/;
      var currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
      var trackingReg = /\.{3}(\S*)/;
      var regexResult;

      regexResult = aheadReg.exec(line);
      status.ahead = regexResult && +regexResult[1] || 0;

      regexResult = behindReg.exec(line);
      status.behind = regexResult && +regexResult[1] || 0;

      regexResult = currentReg.exec(line);
      status.current = regexResult && regexResult[1];

      regexResult = trackingReg.exec(line);
      status.tracking = regexResult && regexResult[1];
   },

   '??': function (line, status) {
      status.not_added.push(line);
   },

   A: function (line, status) {
      status.created.push(line);
   },

   AM: function (line, status) {
      status.created.push(line);
   },

   D: function (line, status) {
      status.deleted.push(line);
   },

   M: function (line, status, indexState) {
      status.modified.push(line);

      if (indexState === 'M') {
         status.staged.push(line);
      }
   },

   R: function (line, status) {
      const detail = /^(.+) -> (.+)$/.exec(line) || [null, line, line];

      status.renamed.push({
         from: String(detail[1]),
         to: String(detail[2])
      });
   },

   UU: function (line, status) {
      status.conflicted.push(line);
   }
};

StatusSummaryParsers.MM = StatusSummaryParsers.M;

/* Map all unmerged status code combinations to UU to mark as conflicted */
StatusSummaryParsers.AA = StatusSummaryParsers.UU;
StatusSummaryParsers.UD = StatusSummaryParsers.UU;
StatusSummaryParsers.DU = StatusSummaryParsers.UU;
StatusSummaryParsers.DD = StatusSummaryParsers.UU;
StatusSummaryParsers.AU = StatusSummaryParsers.UU;
StatusSummaryParsers.UA = StatusSummaryParsers.UU;

export const parseStatusSummary = function (text: string): StatusSummary {
   var file;
   var lines = text.trim().split('\n');
   var status = new StatusSummary();

   for (var i = 0, l = lines.length; i < l; i++) {
      file = splitLine(lines[i]);

      if (!file) {
         continue;
      }

      if (file.handler) {
         file.handler(file.path, status, file.index, file.workingDir);
      }

      if (file.code !== '##') {
         status.files.push(new FileStatusSummary(file.path, file.index, file.workingDir));
      }
   }

   return status;
};


function splitLine(lineStr: string) {
   var line = lineStr.trim().match(/(..?)(\s+)(.*)/);
   if (!line || !line[1].trim()) {
      line = lineStr.trim().match(/(..?)\s+(.*)/);
   }

   if (!line) {
      return;
   }

   var code = line[1];
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
      handler: StatusSummaryParsers[code.trim()],
      path: line[3]
   };
}
