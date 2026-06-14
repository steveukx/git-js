export function asArray<T>(source: T | T[]): T[] {
   return Array.isArray(source) ? source : [source];
}

export function asNumber(source: string | null | undefined, onNaN = 0): number {
   if (source == null) {
      return onNaN;
   }

   const value = parseInt(source, 10);
   return Number.isNaN(value) ? onNaN : value;
}

/** Splits text into lines, dropping blank lines and (by default) trimming each. */
export function toLinesWithContent(input = '', trimmed = true, separator = '\n'): string[] {
   return input.split(separator).reduce<string[]>((output, line) => {
      const content = trimmed ? line.trim() : line;
      if (content) {
         output.push(content);
      }
      return output;
   }, []);
}
