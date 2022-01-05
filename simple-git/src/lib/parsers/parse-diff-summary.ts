import { DiffResult } from '../../../typings';
import { DiffSummary } from '../responses/DiffSummary';

export function parseDiffResult(stdOut: string): DiffResult {
   const lines = stdOut.trim().split('\n');
   const status = new DiffSummary();
   readSummaryLine(status, lines.pop());

   for (let i = 0, max = lines.length; i < max; i++) {
      const line = lines[i];
      textFileChange(line, status) || binaryFileChange(line, status);
   }

   return status;
}

function readSummaryLine(status: DiffResult, summary?: string) {
   (summary || '')
      .trim()
      .split(', ')
      .forEach(function (text: string) {
         const summary = /(\d+)\s([a-z]+)/.exec(text);
         if (!summary) {
            return;
         }

         summaryType(status, summary[2], parseInt(summary[1], 10));
      });
}

function summaryType (status: DiffResult, key: string, value: number) {
   const match = (/([a-z]+?)s?\b/.exec(key));
   if (!match || !statusUpdate[match[1]]) {
      return;
   }

   statusUpdate[match[1]](status, value);
}

const statusUpdate: {[key: string]: (status: DiffResult, value: number) => void} = {
   file (status, value) {
      status.changed = value;
   },
   deletion (status, value) {
      status.deletions = value;
   },
   insertion (status, value) {
      status.insertions = value;
   }
}

function textFileChange(input: string, {files}: DiffResult) {
   const line = input.trim().match(/^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/);

   if (line) {
      var alterations = (line[3] || '').trim();
      files.push({
         file: line[1].trim(),
         changes: parseInt(line[2], 10),
         insertions: alterations.replace(/-/g, '').length,
         deletions: alterations.replace(/\+/g, '').length,
         binary: false
      });

      return true;
   }

   return false
}

function binaryFileChange(input: string, {files}: DiffResult) {
   const line = input.match(/^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)$/);
   if (line) {
      files.push({
         file: line[1].trim(),
         before: +line[2],
         after: +line[3],
         binary: true
      });
      return true;
   }
   return false;
}
