import { beforeEach, describe, expect, it } from 'vitest';
import { promiseError } from '@kwsites/promise-result';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import type { SimpleGit } from '../..';

describe('updateServerInfo', () => {
   let git: SimpleGit;

   beforeEach(() => (git = newSimpleGit()));

   it('update server info', async () => {
      const queue = git.updateServerInfo();
      closeWithSuccess();

      expect(await promiseError(queue)).toBeUndefined();
      assertExecutedCommands('update-server-info');
   });
});
