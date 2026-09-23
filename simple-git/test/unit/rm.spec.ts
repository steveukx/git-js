import { beforeEach, describe, it, type Mock, vi } from 'vitest';

import type { SimpleGit } from '../../src/typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('rm', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = vi.fn();
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
