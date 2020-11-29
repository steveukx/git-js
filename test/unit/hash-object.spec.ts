import { SimpleGit } from 'simple-git';
import { assertExecutedCommands, newSimpleGit } from './__fixtures__';
const {restore, closeWithSuccess} = require('./include/setup');

describe('hash-object', () => {
   let git: SimpleGit;

   beforeEach(() => git = newSimpleGit());

   afterEach(() => restore());

   it('trims the output', async () => {
     const task = git.hashObject('index.js');
     await closeWithSuccess(`
3b18e512dba79e4c8300dd08aeb37f8e728b8dad
     `);

     assertExecutedCommands('hash-object', 'index.js');
     expect(await task).toEqual('3b18e512dba79e4c8300dd08aeb37f8e728b8dad');
   });

   it('optionally writes the result', async () => {
     git.hashObject('index.js', true);
     await closeWithSuccess();
     assertExecutedCommands('hash-object', 'index.js', '-w');
   });
});
