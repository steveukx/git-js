import { promiseError } from '@kwsites/promise-result';
import { assertExecutedCommands, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';

const {closeWithSuccess, restore} = require('./include/setup');

describe('updateServerInfo', () => {
   let git: SimpleGit;

   beforeEach(() =>git = newSimpleGit());
   afterEach(() => restore());

   it('update server info', async () => {
      const queue = git.updateServerInfo();
      closeWithSuccess();

      expect(await promiseError(queue)).toBeUndefined();
      assertExecutedCommands('update-server-info');
   });

});
