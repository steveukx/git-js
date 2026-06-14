export type LineReader = (offset: number) => string | undefined;

export type UseMatches<T> = (target: T, matches: string[]) => boolean | void;

/**
 * Matches one or more consecutive lines against an ordered list of regular
 * expressions, feeding the captured groups into `useMatches` to mutate a running
 * result. A parser that matches all of its expressions and whose `useMatches` does
 * not explicitly return `false` is considered to have consumed the line(s).
 */
export class LineParser<T> {
   private readonly expressions: RegExp[];
   protected matches: string[] = [];

   constructor(
      expression: RegExp | RegExp[],
      protected readonly useMatches: UseMatches<T> = useMatchesNotImplemented
   ) {
      this.expressions = Array.isArray(expression) ? expression : [expression];
   }

   parse = (line: LineReader, target: T): boolean => {
      this.matches = [];

      const matchedEvery = this.expressions.every((expression, index) =>
         this.addMatch(expression, index, line(index))
      );

      if (!matchedEvery) {
         return false;
      }

      return this.useMatches(target, this.prepareMatches()) !== false;
   };

   protected prepareMatches(): string[] {
      return this.matches;
   }

   protected addMatch(expression: RegExp, index: number, line?: string): boolean {
      const matched = line ? expression.exec(line) : null;
      if (matched) {
         this.pushMatch(index, matched);
      }

      return Boolean(matched);
   }

   protected pushMatch(_index: number, matched: string[]): void {
      this.matches.push(...matched.slice(1));
   }
}

/**
 * A line parser that only matches `remote:`-prefixed lines, used to read the
 * messages git emits over the side-band of a fetch/push.
 */
export class RemoteLineParser<T> extends LineParser<T> {
   protected addMatch(expression: RegExp, index: number, line?: string): boolean {
      return /^remote:\s/.test(String(line)) && super.addMatch(expression, index, line);
   }

   protected pushMatch(index: number, matched: string[]): void {
      if (index > 0 || matched.length > 1) {
         super.pushMatch(index, matched);
      }
   }
}

function useMatchesNotImplemented(): never {
   throw new Error('LineParser: useMatches not implemented');
}
