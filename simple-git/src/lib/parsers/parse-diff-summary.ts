import type { DiffResult } from '../../typings';
import { LogFormat } from '../args/log-format';
import { DiffSummary } from '../responses/DiffSummary';
import { isDiffNameStatus } from '../tasks/diff-name-status';
import { asNumber, LineParser, orVoid, parseStringResponse } from '../utils';

const GIT_ESCAPE_MAP: Record<string, number> = {
   a: 0x07,
   b: 0x08,
   t: 0x09,
   n: 0x0a,
   v: 0x0b,
   f: 0x0c,
   r: 0x0d,
   '"': 0x22,
   '\\': 0x5c,
};

function unquoteGitPath(file: string): string {
   if (file.length < 2 || !file.startsWith('"') || !file.endsWith('"')) {
      return file;
   }

   const inner = file.slice(1, -1);
   const bytes: number[] = [];

   for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '\\' && i + 1 < inner.length) {
         const next = inner[i + 1];
         if (i + 3 < inner.length) {
            const oct = inner.slice(i + 1, i + 4);
            if (/^[0-7]{3}$/.test(oct)) {
               bytes.push(Number.parseInt(oct, 8));
               i += 3;
               continue;
            }
         }
         if (next in GIT_ESCAPE_MAP) {
            bytes.push(GIT_ESCAPE_MAP[next]);
            i += 1;
            continue;
         }
      }
      const cp = inner.codePointAt(i) ?? 0;
      if (cp < 0x80) {
         bytes.push(cp);
      } else {
         const str = String.fromCodePoint(cp);
         bytes.push(...Buffer.from(str, 'utf-8'));
         if (cp > 0xffff) i += 1;
      }
   }

   return Buffer.from(bytes).toString('utf-8');
}

const statParser = [
   new LineParser<DiffResult>(
      /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
      (result, [file, changes, alterations = '']) => {
         result.files.push({
            file: unquoteGitPath(file.trim()),
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
            file: unquoteGitPath(file.trim()),
            before: asNumber(before),
            after: asNumber(after),
            binary: true,
         });
      }
   ),
   new LineParser<DiffResult>(/^(.+)\s+\|\s+Bin\s*$/, (result, [file]) => {
      result.files.push({
         file: unquoteGitPath(file.trim()),
         before: 0,
         after: 0,
         binary: true,
      });
   }),
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
            file: unquoteGitPath(file),
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
         file: unquoteGitPath(file),
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
         file: unquoteGitPath(file),
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
         const unquotedFrom = unquoteGitPath(from);
         const unquotedTo = to ? unquoteGitPath(to) : undefined;
         result.changed++;
         result.files.push({
            file: unquotedTo ?? unquotedFrom,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: false,
            status: orVoid(isDiffNameStatus(status) && status),
            from: orVoid(!!unquotedTo && unquotedFrom !== unquotedTo && unquotedFrom),
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
