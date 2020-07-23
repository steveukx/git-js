import { TaskParser, TaskResponseFormat } from '../tasks/task';
import { GitOutputStreams } from './git-output-streams';
import { LineParser } from './line-parser';
import { toLinesWithContent } from './util';

export function callTaskParser<INPUT extends TaskResponseFormat, RESPONSE>(parser: TaskParser<INPUT, RESPONSE>, streams: GitOutputStreams<INPUT>) {
   return parser(streams.stdOut, streams.stdErr);
}

export function parseStringResponse<T>(result: T, parsers: LineParser<T>[], text: string): T {
   for (let lines = toLinesWithContent(text), i = 0, max = lines.length; i < max; i++) {
      const line = (offset = 0) => {
         if ((i + offset) >= max) {
            return;
         }
         return lines[i + offset];
      }

      parsers.some(({parse}) => parse(line, result));
   }

   return result;
}
