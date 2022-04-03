import { assertExecutedCommands } from '@simple-git/test-utils';
import type { SimpleGit } from '../../typings';
import { closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('rm', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('remove single file', async () => {
      git.rm('string', callback);
      await closeWithSuccess();
      assertExecutedCommands('rm', '-f', 'string');
   });

   it('remove multiple files', async () => {
      git.rm(['foo', 'bar'], callback);
      await closeWithSuccess();
      assertExecutedCommands('rm', '-f', 'foo', 'bar');
   });
});
