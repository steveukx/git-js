export class LineParser<T> {
   protected matches: string[] = [];

   private _regExp: RegExp[];

   constructor(
      regExp: RegExp | RegExp[],
      useMatches?: (target: T, match: string[]) => boolean | void
   ) {
      this._regExp = Array.isArray(regExp) ? regExp : [regExp];
      if (useMatches) {
         this.useMatches = useMatches;
      }
   }

   parse = (line: (offset: number) => string | undefined, target: T): boolean => {
      this.resetMatches();

      if (!this._regExp.every((reg, index) => this.addMatch(reg, index, line(index)))) {
         return false;
      }

      return this.useMatches(target, this.prepareMatches()) !== false;
   };

   // @ts-ignore
   protected useMatches(target: T, match: string[]): boolean | void {
      throw new Error(`LineParser:useMatches not implemented`);
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
   protected addMatch(reg: RegExp, index: number, line?: string): boolean {
      return /^remote:\s/.test(String(line)) && super.addMatch(reg, index, line);
   }

   protected pushMatch(index: number, matched: string[]) {
      if (index > 0 || matched.length > 1) {
         super.pushMatch(index, matched);
      }
   }
}
