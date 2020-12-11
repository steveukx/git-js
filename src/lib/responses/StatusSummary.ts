import { FileStatusResult, StatusResult, StatusResultRenamed } from '../../../typings';
import { append } from '../utils';
import { FileStatusSummary } from './FileStatusSummary';

/**
 * The StatusSummary is returned as a response to getting `git().status()`
 */
export class StatusSummary implements StatusResult {
   public not_added: string[] = [];
   public conflicted: string[] = [];
   public created: string[] = [];
   public deleted: string[] = [];
   public modified: string[] = [];
   public renamed: StatusResultRenamed[] = [];

   /**
    * All files represented as an array of objects containing the `path` and status in `index` and
    * in the `working_dir`.
    */
   public files: FileStatusResult[] = [];
   public staged: string[] = [];

   /**
    * Number of commits ahead of the tracked branch
    */
   public ahead = 0;

   /**
    *Number of commits behind the tracked branch
    */
   public behind = 0;

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
   public isClean(): boolean {
      return !this.files.length;
   }
}

enum PorcelainFileStatus {
   ADDED = 'A',
   DELETED = 'D',
   MODIFIED = 'M',
   RENAMED = 'R',
   COPIED = 'C',
   UNMERGED = 'U',
   UNTRACKED = '?',
   IGNORED = '!',
   NONE = ' ',
}

function renamedFile(line: string) {
   const detail = /^(.+) -> (.+)$/.exec(line);

   if (!detail) {
      return {
         from: line, to: line
      };
   }

   return {
      from: String(detail[1]),
      to: String(detail[2]),
   };
}

function parser(indexX: PorcelainFileStatus, indexY: PorcelainFileStatus, handler: (result: StatusSummary, file: string) => void): [string, (result: StatusSummary, file: string) => unknown] {
   return [`${indexX}${indexY}`, handler];
}

function conflicts(indexX: PorcelainFileStatus, ...indexY: PorcelainFileStatus[]) {
   return indexY.map(y => parser(indexX, y, (result, file) => append(result.conflicted, file)));
}

const parsers: Map<string, (result: StatusSummary, file: string) => unknown> = new Map([
   parser(PorcelainFileStatus.NONE, PorcelainFileStatus.ADDED, (result, file) => append(result.created, file)),
   parser(PorcelainFileStatus.NONE, PorcelainFileStatus.DELETED, (result, file) => append(result.deleted, file)),
   parser(PorcelainFileStatus.NONE, PorcelainFileStatus.MODIFIED, (result, file) => append(result.modified, file)),

   parser(PorcelainFileStatus.ADDED, PorcelainFileStatus.NONE, (result, file) => append(result.created, file) && append(result.staged, file)),
   parser(PorcelainFileStatus.ADDED, PorcelainFileStatus.MODIFIED, (result, file) =>
      append(result.created, file) && append(result.staged, file) && append(result.modified, file)),

   parser(PorcelainFileStatus.DELETED, PorcelainFileStatus.NONE, (result, file) => append(result.deleted, file) && append(result.staged, file)),

   parser(PorcelainFileStatus.MODIFIED, PorcelainFileStatus.NONE, (result, file) => append(result.modified, file) && append(result.staged, file)),
   parser(PorcelainFileStatus.MODIFIED, PorcelainFileStatus.MODIFIED, (result, file) => append(result.modified, file) && append(result.staged, file)),

   parser(PorcelainFileStatus.RENAMED, PorcelainFileStatus.NONE, (result, file) => {
      append(result.renamed, renamedFile(file));
   }),
   parser(PorcelainFileStatus.RENAMED, PorcelainFileStatus.MODIFIED, (result, file) => {
      const renamed = renamedFile(file);
      append(result.renamed, renamed);
      append(result.modified, renamed.to);
   }),

   parser(PorcelainFileStatus.UNTRACKED, PorcelainFileStatus.UNTRACKED, (result, file) => append(result.not_added, file)),

   ...conflicts(PorcelainFileStatus.ADDED, PorcelainFileStatus.ADDED, PorcelainFileStatus.UNMERGED),
   ...conflicts(PorcelainFileStatus.DELETED, PorcelainFileStatus.DELETED, PorcelainFileStatus.UNMERGED),
   ...conflicts(PorcelainFileStatus.UNMERGED, PorcelainFileStatus.ADDED, PorcelainFileStatus.DELETED, PorcelainFileStatus.UNMERGED),

   ['##', (result, line) => {
      const aheadReg = /ahead (\d+)/;
      const behindReg = /behind (\d+)/;
      const currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
      const trackingReg = /\.{3}(\S*)/;
      const onEmptyBranchReg = /\son\s([\S]+)$/;
      let regexResult;

      regexResult = aheadReg.exec(line);
      result.ahead = regexResult && +regexResult[1] || 0;

      regexResult = behindReg.exec(line);
      result.behind = regexResult && +regexResult[1] || 0;

      regexResult = currentReg.exec(line);
      result.current = regexResult && regexResult[1];

      regexResult = trackingReg.exec(line);
      result.tracking = regexResult && regexResult[1];

      regexResult = onEmptyBranchReg.exec(line);
      result.current = regexResult && regexResult[1] || result.current;
   }]
]);

export const parseStatusSummary = function (text: string): StatusResult {
   const lines = text.trim().split('\n');
   const status = new StatusSummary();

   for (let i = 0, l = lines.length; i < l; i++) {
      splitLine(status, lines[i]);
   }

   return status;
};

function splitLine(result: StatusResult, lineStr: string) {
   const trimmed = lineStr.trim();
   switch (' ') {
      case trimmed.charAt(2):
         return data(trimmed.charAt(0), trimmed.charAt(1), trimmed.substr(3));
      case trimmed.charAt(1):
         return data(PorcelainFileStatus.NONE, trimmed.charAt(0), trimmed.substr(2));
      default:
         return;
   }

   function data(index: string, workingDir: string, path: string) {
      const raw = `${index}${workingDir}`;
      const handler = parsers.get(raw);

      if (handler) {
         handler(result, path);
      }

      if (raw !== '##') {
         result.files.push(new FileStatusSummary(path, index, workingDir));
      }
   }
}
