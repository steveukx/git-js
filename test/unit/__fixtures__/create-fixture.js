
module.exports.createFixture = (stdOut, stdErr) => ({
   stdOut,
   stdErr,
   parserArgs: [stdOut, stdErr],
});
