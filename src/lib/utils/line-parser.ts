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
