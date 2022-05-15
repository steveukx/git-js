import simpleGit, { SimpleGit } from '../..';
import { promiseResult, isPromiseFailure, PromiseFailureResult, isPromiseSuccess } from '@kwsites/promise-result';

describe('load-test with maxConcurrentConnections', () => {

   jest.setTimeout(1000 * 60 * 5);

   const large = 10000;
   let currentBranch = 'main';

   beforeEach(async () => (currentBranch = (await simpleGit().branch()).current));

   function getFileLength (git: SimpleGit) {
      return git.raw('show', `${currentBranch}:yarn.lock`).then(content => content.length);
   }

   function runTest(expected: number, maxConcurrentProcesses: number, length: number, logEvery = 250) {
      return promiseResult(Promise.all(
         Array.from<SimpleGit>({length})
            .fill(simpleGit({maxConcurrentProcesses}))
            .map(async (git, index) => {
               const actual = await getFileLength(git);

               if (!(index % logEvery)) {
                  console.log(`... ${index}`);
               }

               if (actual !== expected) throw new Error(`Mismatch at index ${index}: expected=${expected}, actual=${actual}`);

               return actual;
            })
      ));
   }

   it('will fail when attempting to run too many concurrent connections', async () => {
      const attempts = 10000;
      const expected = await getFileLength(simpleGit());

      const result = await runTest(expected, 100, attempts);

      expect(isPromiseFailure(result)).toBe(true);
      expect((result as PromiseFailureResult).error.message).toEqual(expect.stringMatching(/^Mismatch/))
   });

   it('will not fail when attempting to run with low concurrent connections', async () => {
      const expected = await getFileLength(simpleGit());

      const result = await runTest(expected, 10, large);

      expect(isPromiseSuccess(result)).toBe(true);
      expect(result.result).toEqual(
         new Array(large).fill(expected)
      );
   });

});
