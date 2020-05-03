
export const NOOP: (...args: any[]) => void = () => {};

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
