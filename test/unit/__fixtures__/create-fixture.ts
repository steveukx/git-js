export function createFixture (stdOut: string, stdErr: string) {
   return {
      stdOut,
      stdErr,
      parserArgs: [stdOut, stdErr],
   };
}
