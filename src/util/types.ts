

export function toArrayOf<What>(input: What | What[]): What[] {
   if (Array.isArray(input)) {
      return input;
   }

   return [input];
}
