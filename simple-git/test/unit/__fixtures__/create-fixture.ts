type ResponseFixture = {
   stdOut: string;
   stdErr: string;
   parserArgs: [string, string];
};

export function createFixture(stdOut: string, stdErr: string): ResponseFixture {
   return {
      stdOut,
      stdErr,
      parserArgs: [stdOut, stdErr],
   };
}
