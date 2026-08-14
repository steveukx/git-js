import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('submodule', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   describe('add', () => {
      it('adds a named sub module', async () => {
         git.submoduleAdd('my_repo', 'at_path');
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'add', 'my_repo', 'at_path');
      });
   });

   describe('update', () => {
      it('update with no args', async () => {
         git.submoduleUpdate();
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'update');
      });

      it('update with string arg', async () => {
         git.submoduleUpdate('foo');
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'update', 'foo');
      });

      it('update with array arg', async () => {
         git.submoduleUpdate(['foo', 'bar']);
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'update', 'foo', 'bar');
      });
   });

   describe('init', () => {
      it('init with no args', async () => {
         git.submoduleInit();
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'init');
      });

      it('init with string arg', async () => {
         git.submoduleInit('foo');
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'init', 'foo');
      });

      it('init with array arg', async () => {
         git.submoduleInit(['foo', 'bar']);
         await closeWithSuccess();

         assertExecutedCommands('submodule', 'init', 'foo', 'bar');
      });
   });
});
