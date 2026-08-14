import { promiseError } from '@kwsites/promise-result';

import type { SimpleGitCore } from '../../index';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('updateServerInfo', () => {
   let git: SimpleGitCore;

   beforeEach(() => (git = newSimpleGit()));

   it('update server info', async () => {
      const queue = git.updateServerInfo();
      await closeWithSuccess();

      expect(await promiseError(queue)).toBeUndefined();
      assertExecutedCommands('update-server-info');
   });
});
