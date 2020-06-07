export const NOOP: (...args: any[]) => void = () => {
};

/**
 * Returns either the source argument when it is a `Function`, or the default
 * `NOOP` function constant
 */
export function asFunction<T extends Function>(source: T | any): T {
   return typeof source === 'function' ? source : NOOP;
}

/**
 * Determines whether the supplied argument is both a function, and is not
 * the `NOOP` function.
 */
export function isUserFunction<T extends Function>(source: T | any): source is T {
   return (typeof source === 'function' && source !== NOOP);
}

export function splitOn(input: string, char: string): [string, string] {
   const index = input.indexOf(char);
   if (index <= 0) {
      return [input, ''];
   }

   return [
      input.substr(0, index),
      input.substr(index + 1),
   ];
}

export function last<T>(input: T[]): T | undefined {
   return input && input.length ? input[input.length - 1] : undefined;
}

export function toLinesWithContent(input: string, trimmed = false): string[] {
   return input.split('\n')
      .reduce((output, line) => {
         const lineContent = trimmed ? line.trim() : line;
         if (lineContent) {
            output.push(lineContent);
         }
         return output;
      }, [] as string[]);
}
