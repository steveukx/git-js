import { DiffResult } from '../../../typings';
import { LogFormat } from '../args/log-format';
import { DiffSummary } from '../responses/DiffSummary';
import { isDiffNameStatus } from '../tasks/diff-name-status';
import { asNumber, LineParser, orVoid, parseStringResponse } from '../utils';

const statParser = [
   new LineParser<DiffResult>(
      /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
      (result, [file, changes, alterations = '']) => {
         result.files.push({
            file: file.trim(),
            changes: asNumber(changes),
            insertions: alterations.replace(/[^+]/g, '').length,
            deletions: alterations.replace(/[^-]/g, '').length,
            binary: false,
         });
      }
   ),
   new LineParser<DiffResult>(
      /^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/,
      (result, [file, before, after]) => {
         result.files.push({
            file: file.trim(),
            before: asNumber(before),
            after: asNumber(after),
            binary: true,
         });
      }
   ),
   new LineParser<DiffResult>(
      /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
      (result, [changed, summary]) => {
         const inserted = /(\d+) i/.exec(summary);
         const deleted = /(\d+) d/.exec(summary);

         result.changed = asNumber(changed);
         result.insertions = asNumber(inserted?.[1]);
         result.deletions = asNumber(deleted?.[1]);
      }
   ),
];

const numStatParser = [
   new LineParser<DiffResult>(
      /(\d+)\t(\d+)\t(.+)$/,
      (result, [changesInsert, changesDelete, file]) => {
         const insertions = asNumber(changesInsert);
         const deletions = asNumber(changesDelete);

         result.changed++;
         result.insertions += insertions;
         result.deletions += deletions;

         result.files.push({
            file,
            changes: insertions + deletions,
            insertions,
            deletions,
            binary: false,
         });
      }
   ),
   new LineParser<DiffResult>(/-\t-\t(.+)$/, (result, [file]) => {
      result.changed++;

      result.files.push({
         file,
         after: 0,
         before: 0,
         binary: true,
      });
   }),
];

const nameOnlyParser = [
   new LineParser<DiffResult>(/(.+)$/, (result, [file]) => {
      result.changed++;
      result.files.push({
         file,
         changes: 0,
         insertions: 0,
         deletions: 0,
         binary: false,
      });
   }),
];

const nameStatusParser = [
   new LineParser<DiffResult>(
      /([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/,
      (result, [status, similarity, from, _to, to]) => {
         result.changed++;
         result.files.push({
            file: to ?? from,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: false,
            status: orVoid(isDiffNameStatus(status) && status),
            from: orVoid(!!to && from !== to && from),
            similarity: asNumber(similarity),
         });
      }
   ),
];

const diffSummaryParsers: Record<LogFormat, LineParser<DiffResult>[]> = {
   [LogFormat.NONE]: statParser,
   [LogFormat.STAT]: statParser,
   [LogFormat.NUM_STAT]: numStatParser,
   [LogFormat.NAME_STATUS]: nameStatusParser,
   [LogFormat.NAME_ONLY]: nameOnlyParser,
};

export function getDiffParser(format = LogFormat.NONE) {
   const parser = diffSummaryParsers[format];

   return (stdOut: string) => parseStringResponse(new DiffSummary(), parser, stdOut, false);
}
