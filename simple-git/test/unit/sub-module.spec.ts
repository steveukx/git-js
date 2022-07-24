import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';

describe('submodule', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   describe('add', () => {
      it('adds a named sub module', async () => {
         const queue = git.submoduleAdd('my_repo', 'at_path', callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'add', 'my_repo', 'at_path');
      });
   });

   describe('update', () => {
      it('update with no args', async () => {
         const queue = git.submoduleUpdate(callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'update');
      });

      it('update with string arg', async () => {
         const queue = git.submoduleUpdate('foo', callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'update', 'foo');
      });

      it('update with array arg', async () => {
         const queue = git.submoduleUpdate(['foo', 'bar'], callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'update', 'foo', 'bar');
      });
   });

   describe('init', () => {
      it('init with no args', async () => {
         const queue = git.submoduleInit(callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'init');
      });

      it('init with string arg', async () => {
         const queue = git.submoduleInit('foo', callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'init', 'foo');
      });

      it('init with array arg', async () => {
         const queue = git.submoduleInit(['foo', 'bar'], callback);
         closeWithSuccess();

         expect(callback).toBeCalledWith(null, await queue);
         assertExecutedCommands('submodule', 'init', 'foo', 'bar');
      });
   });
});
