import { toLinesWithContent } from './util';

export function parseLinesWithContent<T>(result: T, parsers: LineParser<T>[], text: string) {
   for (let lines = toLinesWithContent(text), i = 0, max = lines.length; i < max; i++) {
      let usedOffset = 0;
      const line = (offset = 0) => {
         if ((i + offset) >= max) {
            return;
         }

         usedOffset = Math.max(usedOffset, offset);
         return lines[i + offset];
      }

      parsers.some(({parse}) => {
         usedOffset = 0;
         const parsedLine = parse(line, result);
         if (parsedLine) {
            i+= usedOffset;
         }

         return parsedLine;
      });
   }

   return result;
}

export class LineParser<T> {
   private _regExp: RegExp[];

   protected matches: string[] = [];

   constructor(
      regExp: RegExp | RegExp[],
      useMatches?: (target: T, match: string[]) => boolean | void,
   ) {
      this._regExp = Array.isArray(regExp) ? regExp : [regExp];
      if (useMatches) {
         this.useMatches = useMatches;
      }
   }

   // @ts-ignore
   protected useMatches(target: T, match: string[]): boolean | void {
      throw new Error(`LineParser:useMatches not implemented`);
   }

   parse = (line: (offset: number) => (string | undefined), target: T): boolean => {
      this.resetMatches();

      if (!this._regExp.every((reg, index) => this.addMatch(reg, index, line(index)))) {
         return false;
      }

      return this.useMatches(target, this.prepareMatches()) !== false;
   }

   protected resetMatches() {
      this.matches.length = 0;
   }

   protected prepareMatches() {
      return this.matches;
   }

   protected addMatch(reg: RegExp, index: number, line?: string) {
      const matched = line && reg.exec(line);
      if (matched) {
         this.pushMatch(index, matched);
      }

      return !!matched;
   }

   protected pushMatch(_index: number, matched: string[]) {
      this.matches.push(...matched.slice(1));
   }

}

export class RemoteLineParser<T> extends LineParser<T> {

   constructor(regExp: RegExp | RegExp[], useMatches: ((target: T, match: string[]) => boolean | void) | undefined) {
      super(regExp, useMatches);
   }

   protected addMatch(reg: RegExp, index: number, line?: string): boolean {
      return /^remote:\s/.test(String(line)) && super.addMatch(reg, index, line);
   }

   protected pushMatch(index: number, matched: string[]) {
      if (index > 0 || matched.length > 1) {
         super.pushMatch(index, matched);
      }
   }

}
