import { StatusResult } from '../../../typings';
import { append, NULL } from '../utils';
import { FileStatusSummary } from './FileStatusSummary';

type StatusLineParser = (result: StatusResult, file: string) => void;

export class StatusSummary implements StatusResult {
   public not_added = [];
   public conflicted = [];
   public created = [];
   public deleted = [];
   public ignored = undefined;
   public modified = [];
   public renamed = [];
   public files = [];
   public staged = [];
   public ahead = 0;
   public behind = 0;
   public current = null;
   public tracking = null;
   public detached = false;

   public isClean = () => {
      return !this.files.length;
   };
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
   const [to, from] = line.split(NULL);

   return {
      from: from || to,
      to,
   };
}

function parser(
   indexX: PorcelainFileStatus,
   indexY: PorcelainFileStatus,
   handler: StatusLineParser
): [string, StatusLineParser] {
   return [`${indexX}${indexY}`, handler];
}

function conflicts(indexX: PorcelainFileStatus, ...indexY: PorcelainFileStatus[]) {
   return indexY.map((y) => parser(indexX, y, (result, file) => append(result.conflicted, file)));
}

const parsers: Map<string, StatusLineParser> = new Map([
   parser(PorcelainFileStatus.NONE, PorcelainFileStatus.ADDED, (result, file) =>
      append(result.created, file)
   ),
   parser(PorcelainFileStatus.NONE, PorcelainFileStatus.DELETED, (result, file) =>
      append(result.deleted, file)
   ),
   parser(PorcelainFileStatus.NONE, PorcelainFileStatus.MODIFIED, (result, file) =>
      append(result.modified, file)
   ),

   parser(
      PorcelainFileStatus.ADDED,
      PorcelainFileStatus.NONE,
      (result, file) => append(result.created, file) && append(result.staged, file)
   ),
   parser(
      PorcelainFileStatus.ADDED,
      PorcelainFileStatus.MODIFIED,
      (result, file) =>
         append(result.created, file) &&
         append(result.staged, file) &&
         append(result.modified, file)
   ),

   parser(
      PorcelainFileStatus.DELETED,
      PorcelainFileStatus.NONE,
      (result, file) => append(result.deleted, file) && append(result.staged, file)
   ),

   parser(
      PorcelainFileStatus.MODIFIED,
      PorcelainFileStatus.NONE,
      (result, file) => append(result.modified, file) && append(result.staged, file)
   ),
   parser(
      PorcelainFileStatus.MODIFIED,
      PorcelainFileStatus.MODIFIED,
      (result, file) => append(result.modified, file) && append(result.staged, file)
   ),

   parser(PorcelainFileStatus.RENAMED, PorcelainFileStatus.NONE, (result, file) => {
      append(result.renamed, renamedFile(file));
   }),
   parser(PorcelainFileStatus.RENAMED, PorcelainFileStatus.MODIFIED, (result, file) => {
      const renamed = renamedFile(file);
      append(result.renamed, renamed);
      append(result.modified, renamed.to);
   }),
   parser(PorcelainFileStatus.IGNORED, PorcelainFileStatus.IGNORED, (_result, _file) => {
      append((_result.ignored = _result.ignored || []), _file);
   }),

   parser(PorcelainFileStatus.UNTRACKED, PorcelainFileStatus.UNTRACKED, (result, file) =>
      append(result.not_added, file)
   ),

   ...conflicts(PorcelainFileStatus.ADDED, PorcelainFileStatus.ADDED, PorcelainFileStatus.UNMERGED),
   ...conflicts(
      PorcelainFileStatus.DELETED,
      PorcelainFileStatus.DELETED,
      PorcelainFileStatus.UNMERGED
   ),
   ...conflicts(
      PorcelainFileStatus.UNMERGED,
      PorcelainFileStatus.ADDED,
      PorcelainFileStatus.DELETED,
      PorcelainFileStatus.UNMERGED
   ),

   [
      '##',
      (result, line) => {
         const aheadReg = /ahead (\d+)/;
         const behindReg = /behind (\d+)/;
         const currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
         const trackingReg = /\.{3}(\S*)/;
         const onEmptyBranchReg = /\son\s([\S]+)$/;
         let regexResult;

         regexResult = aheadReg.exec(line);
         result.ahead = (regexResult && +regexResult[1]) || 0;

         regexResult = behindReg.exec(line);
         result.behind = (regexResult && +regexResult[1]) || 0;

         regexResult = currentReg.exec(line);
         result.current = regexResult && regexResult[1];

         regexResult = trackingReg.exec(line);
         result.tracking = regexResult && regexResult[1];

         regexResult = onEmptyBranchReg.exec(line);
         result.current = (regexResult && regexResult[1]) || result.current;

         result.detached = /\(no branch\)/.test(line);
      },
   ],
]);

export const parseStatusSummary = function (text: string): StatusResult {
   const lines = text.split(NULL);
   const status = new StatusSummary();

   for (let i = 0, l = lines.length; i < l; ) {
      let line = lines[i++].trim();

      if (!line) {
         continue;
      }

      if (line.charAt(0) === PorcelainFileStatus.RENAMED) {
         line += NULL + (lines[i++] || '');
      }

      splitLine(status, line);
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

      if (raw !== '##' && raw !== '!!') {
         result.files.push(new FileStatusSummary(path, index, workingDir));
      }
   }
}
