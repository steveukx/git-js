type ResponseFixture = {
   stdOut: string;
   stdErr: string;
   parserArgs: [string, string];
};

export function createFixture(stdOut: string, stdErr = ''): ResponseFixture {
   return {
      stdOut,
      stdErr,
      parserArgs: [stdOut, stdErr],
   };
}
