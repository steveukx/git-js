import { assertExecutedCommands, closeWithSuccess, newSimpleGit, newSimpleGitP } from './__fixtures__';
import { SimpleGit } from '../../typings';

describe('revParse', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      callback = jest.fn();
   });

   describe('simple-git/promise', () => {
      beforeEach(() => git = newSimpleGitP());

      it('returns rev-parse data to a promise', async () => {
         const queue = git.revparse(['--show-toplevel']);
         closeWithSuccess('  /var/tmp/some-root   ');

         expect(await queue).toBe('/var/tmp/some-root');
         assertExecutedCommands('rev-parse', '--show-toplevel');
      });
   });


   describe('simple-git', () => {
      beforeEach(() => git = newSimpleGit());

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
         const queue = git.revparse('foo', {bar: null}, callback);
         await closeWithSuccess(' some data ');
         expect(await queue).toBe('some data');
         expect(callback).toHaveBeenCalledWith(null, 'some data');
         assertExecutedCommands('rev-parse', 'foo', 'bar');
      })
   });

});
