import { ListLogLine, LogResult } from '../../../typings';
import { toLinesWithContent } from '../utils';
import { parseDiffResult } from './parse-diff-summary';

export const START_BOUNDARY = 'òòòòòò ';

export const COMMIT_BOUNDARY = ' òò';

export const SPLITTER = ' ò ';

const defaultFieldNames = ['hash', 'date', 'message', 'refs', 'author_name', 'author_email'];

function lineBuilder(tokens: string[], fields: string[]): any {
   return fields.reduce((line, field, index) => {
      line[field] = tokens[index] || '';
      return line;
   }, Object.create({diff: null}) as any);
}

export function createListLogSummaryParser<T = any> (splitter = SPLITTER, fields = defaultFieldNames) {
   return function (stdOut: string): LogResult<T> {
      const all: ReadonlyArray<T & ListLogLine> = toLinesWithContent(stdOut, true, START_BOUNDARY)
         .map(function (item) {
            const lineDetail = item.trim().split(COMMIT_BOUNDARY);
            const listLogLine: T & ListLogLine = lineBuilder(lineDetail[0].trim().split(splitter), fields);

            if (lineDetail.length > 1 && !!lineDetail[1].trim()) {
               listLogLine.diff = parseDiffResult(lineDetail[1]);
            }

            return listLogLine;
         });

      return {
         all,
         latest: all.length && all[0] || null,
         total: all.length,
      };
   }
}
