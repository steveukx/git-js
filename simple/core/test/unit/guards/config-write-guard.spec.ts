import {promiseError} from '@kwsites/promise-result';

import {GitPluginError} from '../../../src/errors';
import {allowConfigWriteUser} from '../../../src/guards/presets';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
} from '../../__fixtures__';

describe('configWriteGuard', () => {
   it('blocks config writes by default', async () => {
      const queue = newSimpleGit().raw('config', 'user.name', 'Steve');

      const error = await promiseError(queue);
      assertGitError(error, 'user.name', GitPluginError);
      assertGitError(error, 'allowConfigWrite');
      assertNoExecutedTasks();
   });

   it('allows config writes matching the allow-list', async () => {
      const queue = newSimpleGit({ allowConfigWrite: ['user.name'] }).raw(
         'config',
         'user.name',
         'Steve'
      );
      await closeWithSuccess();

      await queue;
      assertExecutedCommands('config', 'user.name', 'Steve');
   });

   it('allowed wildcards are explicit', async () => {
      const git = newSimpleGit({ allowConfigWrite: ['remote.*.url'] });

      const allowed = git.raw('config', 'remote.origin.url', 'https://example.com/repo.git');
      await closeWithSuccess();
      await allowed;

      assertGitError(
         await promiseError(git.raw('config', 'remote.url', 'https://example.com/repo.git')),
         'allowConfigWrite',
         GitPluginError
      );
   });

   it('blocks writes supplied through -c flags', async () => {
      const queue = newSimpleGit().raw('-c', 'core.pager=cat', 'log');

      assertGitError(await promiseError(queue), 'core.pager', GitPluginError);
      assertNoExecutedTasks();
   });

   it('subjects construction-time config to the same guard as a runtime -c', async () => {
      assertGitError(
         await promiseError(newSimpleGit({ config: ['foo.bar=1'] }).raw('status')),
         'foo.bar',
         GitPluginError
      );

      const allowed = newSimpleGit({
         config: ['foo.bar=1'],
         allowConfigWrite: ['foo.bar'],
      }).raw('status');
      await closeWithSuccess();
      await allowed;

      assertExecutedCommands('-c', 'foo.bar=1', 'status');
   });

   it('guards the GIT_CONFIG_COUNT environment channel', async () => {
      // `allowEnvironment` will let the unsafe GIT_CONFIG_* environment variables through
      // they still need to be enabled with the `unsafe` settings
      // _and_ the values would need to be opted in through the allowConfigWrite setting
      const git = newSimpleGit({
         allowEnvironment: ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'],
         unsafe: { allowUnsafeConfigEnvCount: true, allowUnsafePager: true },
         // allowConfigWrite: ['core.pager']
      }).env({
         GIT_CONFIG_COUNT: '1',
         GIT_CONFIG_KEY_0: 'core.pager',
         GIT_CONFIG_VALUE_0: 'cat',
      });

      assertGitError(await promiseError(git.raw('log')), /"core.pager" .* allowConfigWrite/, GitPluginError);
      assertNoExecutedTasks();
   });

   it('excuses library-authored trusted config injections but not user writes', async () => {
      // commit() injects `-c core.abbrev=40` (branded trusted internally), so
      // a plain commit passes the guard without any allow-list
      const committed = newSimpleGit().commit('message');
      await closeWithSuccess();
      await committed;
      assertExecutedCommands('-c', 'core.abbrev=40', 'commit', '-m', 'message');

      // the same key written by the caller is still gated
      assertGitError(
         await promiseError(newSimpleGit().raw('-c', 'core.abbrev=40', 'commit', '-m', 'message')),
         'core.abbrev',
         GitPluginError
      );
   });

   it('leaves config reads unaffected', async () => {
      const queue = newSimpleGit().raw('config', '--list');
      await closeWithSuccess('user.name=Steve');

      expect(await queue).toBe('user.name=Steve');
   });

   it('ships allowConfigWriteUser as a spreadable preset, not an exemption', async () => {
      expect(allowConfigWriteUser).toEqual(['user.name', 'user.email']);

      const git = newSimpleGit({ allowConfigWrite: [...allowConfigWriteUser] });

      const allowed = git.raw('config', 'user.email', 's@e.com');
      await closeWithSuccess();
      await allowed;

      assertGitError(
         await promiseError(git.raw('config', 'init.defaultbranch', 'main')),
         'allowConfigWrite',
         GitPluginError
      );
   });
});
