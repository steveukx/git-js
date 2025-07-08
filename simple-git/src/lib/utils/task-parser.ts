import type { MaybeArray, TaskParser, TaskResponseFormat } from '../types';
import { GitOutputStreams } from './git-output-streams';
import { LineParser } from './line-parser';
import { asArray, toLinesWithContent } from './util';

export function callTaskParser<INPUT extends TaskResponseFormat, RESPONSE>(
   parser: TaskParser<INPUT, RESPONSE>,
   streams: GitOutputStreams<INPUT>
) {
   return parser(streams.stdOut, streams.stdErr);
}

export function parseStringResponse<T>(
   result: T,
   parsers: LineParser<T>[],
   texts: MaybeArray<string>,
   trim = true
): T {
   asArray(texts).forEach((text) => {
      for (let lines = toLinesWithContent(text, trim), i = 0, max = lines.length; i < max; i++) {
         const line = (offset = 0) => {
            if (i + offset >= max) {
               return;
            }
            return lines[i + offset];
         };

         parsers.some(({ parse }) => parse(line, result));
      }
   });

   return result;
}
