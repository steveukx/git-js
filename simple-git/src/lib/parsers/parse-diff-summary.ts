import { DiffResult } from '../../../typings';
import { DiffSummary } from '../responses/DiffSummary';
import { asNumber, LineParser, parseStringResponse } from '../utils';

const parsers = {
   summary: new LineParser<DiffResult>(/(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/, (result, [changed, summary]) => {
      const inserted = /(\d+) i/.exec(summary);
      const deleted = /(\d+) d/.exec(summary);

      result.changed = asNumber(changed);
      result.insertions = asNumber(inserted?.[1]);
      result.deletions = asNumber(deleted?.[1]);
   }),

   binary: new LineParser<DiffResult>(/(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/, (result, [file, before, after]) => {
      result.files.push({
         file: file.trim(),
         before: asNumber(before),
         after: asNumber(after),
         binary: true
      });
   }),

   text: new LineParser<DiffResult>(/(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/, (result, [file, changes, alterations = '']) => {
      result.files.push({
         file: file.trim(),
         changes: asNumber(changes),
         insertions: alterations.replace(/[^+]/g, '').length,
         deletions: alterations.replace(/[^-]/g, '').length,
         binary: false
      });
   }),
}

export function parseDiffResult(stdOut: string): DiffResult {
   const status = new DiffSummary();

   parseStringResponse(status, [
      parsers.text,
      parsers.binary,
      parsers.summary,
   ], stdOut);

   return status;
}
