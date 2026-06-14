import type { LineParser } from './line-parser';
import { asArray, toLinesWithContent } from './parse.helpers';

/**
 * Runs each chunk of text through the supplied line parsers, line by line. The
 * first parser to consume a line (return other than `false`) wins for that line,
 * mutating the shared `result` which is returned once every line is exhausted.
 */
export function parseStringResponse<T>(
   result: T,
   parsers: LineParser<T>[],
   texts: string | string[],
   trim = true
): T {
   for (const text of asArray(texts)) {
      const lines = toLinesWithContent(text, trim);

      for (let index = 0; index < lines.length; index++) {
         const line: (offset?: number) => string | undefined = (offset = 0) =>
            index + offset < lines.length ? lines[index + offset] : undefined;

         parsers.some(({ parse }) => parse(line, result));
      }
   }

   return result;
}
