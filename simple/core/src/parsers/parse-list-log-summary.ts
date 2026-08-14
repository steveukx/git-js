import { LogFormat } from '../args/log-format';
import type { ListLogLine, LogResult } from '../tasks/log';
import { toLinesWithContent } from '../utils';
import { getDiffParser } from './parse-diff-summary';

export const START_BOUNDARY = 'òòòòòò ';

export const COMMIT_BOUNDARY = ' òò';

export const SPLITTER = ' ò ';

const defaultFieldNames = ['hash', 'date', 'message', 'refs', 'author_name', 'author_email'];

// biome-ignore lint/suspicious/noExplicitAny: <TODO>
function lineBuilder(tokens: string[], fields: string[]): any {
   return fields.reduce(
      (line, field, index) => {
         line[field] = tokens[index] || '';
         return line;
      },
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      Object.create({ diff: null }) as any
   );
}

// biome-ignore lint/suspicious/noExplicitAny: <narrowed by outer generic>
export function createListLogSummaryParser<T = any>(
   splitter: string = SPLITTER,
   fields: string[] = defaultFieldNames,
   logFormat: LogFormat = LogFormat.NONE
): (stdOut: string) => LogResult<T> {
   const parseDiffResult = getDiffParser(logFormat);

   return (stdOut: string): LogResult<T> => {
      const all: ReadonlyArray<T & ListLogLine> = toLinesWithContent(
         stdOut.trim(),
         false,
         START_BOUNDARY
      ).map((item) => {
         const lineDetail = item.split(COMMIT_BOUNDARY);
         const listLogLine: T & ListLogLine = lineBuilder(lineDetail[0].split(splitter), fields);

         if (lineDetail.length > 1 && !!lineDetail[1].trim()) {
            listLogLine.diff = parseDiffResult(lineDetail[1]);
         }

         return listLogLine;
      });

      return {
         all,
         latest: (all.length && all[0]) || null,
         total: all.length,
      };
   };
}
