import type { SimpleGitCore } from '../../index';
import { parseMoveResult } from '../../src/parsers/parse-move';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

const renaming = (from: string, to: string) => `Renaming ${from} to ${to}`;

describe('mv', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   describe('parsing', () => {
      it('parses a single file moving', () => {
         const result = parseMoveResult(`
${renaming('s/abc', 'd/abc')}
`);

         expect(result.moves).toEqual([{ from: 's/abc', to: 'd/abc' }]);
      });

      it('parses multiple files moving', () => {
         const result = parseMoveResult(`
${renaming('s/abc', 'd/abc')}
${renaming('name with spaces.foo', 'less-spaces')}
`);

         expect(result.moves).toEqual([
            { from: 's/abc', to: 'd/abc' },
            { from: 'name with spaces.foo', to: 'less-spaces' },
         ]);
      });
   });

   describe('usage', () => {
      it('moves a single file', async () => {
         const promise = git.mv('a', 'b');
         await closeWithSuccess(renaming('a', 'b'));

         await promise;
         assertExecutedCommands('mv', '-v', 'a', 'b');
      });

      it('moves multiple files to a single directory', async () => {
         const promise = git.mv(['a', 'b', 'c'], 'd');
         await closeWithSuccess(`
Renaming a to d/a
Renaming b to d/b
Renaming c to d/c
         `);

         const result = await promise;
         expect(result.moves).toHaveLength(3);
         assertExecutedCommands('mv', '-v', 'a', 'b', 'c', 'd');
      });
   });
});
