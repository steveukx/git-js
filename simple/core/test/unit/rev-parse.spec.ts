import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('revParse', () => {
   let git: SimpleGitCore;

   beforeEach(() => {});

   describe('simple-git', () => {
      beforeEach(() => (git = newSimpleGit()));

      it('called with a string', async () => {
         git.revparse('some string');
         await closeWithSuccess();
         assertExecutedCommands('rev-parse', 'some string');
      });

      it('called with an array of strings', async () => {
         git.revparse(['another', 'string']);
         await closeWithSuccess();
         assertExecutedCommands('rev-parse', 'another', 'string');
      });

      it('called with all arguments', async () => {
         const queue = git.revparse('foo', { bar: null });
         await closeWithSuccess(' some data ');
         expect(await queue).toBe('some data');
         assertExecutedCommands('rev-parse', 'foo', 'bar');
      });
   });
});
