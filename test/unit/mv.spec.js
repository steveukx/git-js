const {restore, newSimpleGit, closeWithSuccess} = require('./include/setup');
const {assertExecutedCommands} = require('../helpers');
const {parseMoveResult} = require('../../src/lib/parsers/parse-move');

const renaming = (from, to) => `Renaming ${ from } to ${ to }`;

describe('mv', () => {
   let git;

   beforeEach(() => git = newSimpleGit());
   afterEach(() => restore());

   describe('parsing', () => {
      it('parses a single file moving', () => {
         const result = parseMoveResult(`
${ renaming('s/abc', 'd/abc') }
`, '');

         expect(result.moves).toEqual([
            {from: 's/abc', to: 'd/abc'}
         ]);
      });

      it('parses multiple files moving', () => {
         const result = parseMoveResult(`
${ renaming('s/abc', 'd/abc') }
${ renaming('name with spaces.foo', 'less-spaces') }
`);

         expect(result.moves).toEqual([
            {from: 's/abc', to: 'd/abc'},
            {from: 'name with spaces.foo', to: 'less-spaces'}
         ]);
      });
   });

   describe('usage', () => {
      let promise, callback;

      beforeEach(() => callback = jest.fn());

      it('moves a single file - with callback', async () => {
         promise = git.mv('a', 'b', callback);
         await closeWithSuccess(renaming('a', 'b'));

         expect(callback).toHaveBeenCalledWith(null, await promise);
         assertExecutedCommands('mv', '-v', 'a', 'b');
      });

      it('moves multiple files to a single directory - with callback', async () => {
         promise = git.mv(['a', 'b', 'c'], 'd', callback);
         await closeWithSuccess(`
Renaming a to d/a
Renaming b to d/b
Renaming c to d/c
         `);

         const result = await promise;
         expect(callback).toHaveBeenCalledWith(null, result);
         expect(result.moves).toHaveLength(3);
         assertExecutedCommands('mv', '-v', 'a', 'b', 'c', 'd');
      });
   });
})
