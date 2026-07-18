import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('rm', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('remove single file', async () => {
      git.rm('string');
      await closeWithSuccess();
      assertExecutedCommands('rm', '-f', 'string');
   });

   it('remove multiple files', async () => {
      git.rm(['foo', 'bar']);
      await closeWithSuccess();
      assertExecutedCommands('rm', '-f', 'foo', 'bar');
   });
});
