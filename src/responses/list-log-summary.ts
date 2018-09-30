/**
 * The ListLogSummary is returned as a response to getting `git().log()` or `git().stashList()`
 *
 * @constructor
 */
import { ListLogLine } from './list-log-line';

export const COMMIT_BOUNDARY = '------------------------ >8 ------------------------';

const LOG_SUMMARY_FIELDS: string[] = ['hash', 'date', 'message', 'author_name', 'author_email'];
const LOG_SUMMARY_SPLITTER = ';;;;';

export class ListLogSummary {

   /**
    * Most recent entry in the log
    */
   public latest: ListLogLine | null;

   /**
    * Number of items in the log
    */
   public total: number;


   constructor(public all: ListLogLine[]) {
      this.latest = all.length && all[0] || null;
      this.total = all.length;
   }

   static parse (text: string): ListLogSummary {
      return parse(text, '');
   }

   static parser (splitter: string = LOG_SUMMARY_SPLITTER, fields: string[] = LOG_SUMMARY_FIELDS): (text: string) => ListLogSummary {
      return (text: string) => parse(text, splitter, fields);
   }
}

function parse(text: string, splitter: string = LOG_SUMMARY_SPLITTER, fields: string[] = LOG_SUMMARY_FIELDS): ListLogSummary {
   return new ListLogSummary(
      text
         .trim()
         .split(COMMIT_BOUNDARY + '\n')
         .map((item: string) => item.replace(COMMIT_BOUNDARY, ''))
         .filter(Boolean)
         .map((item) => new ListLogLine(item.trim().split(splitter), fields))
   );
}
