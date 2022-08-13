import {
   createTestContext,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';
import { GitConfigScope } from '../..';
import { SimpleGit } from '../../typings';

describe('config', () => {
   let context: SimpleGitTestContext;
   let git: SimpleGit;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
   });
   beforeEach(() => (git = newSimpleGit(context.root)));

   async function configurationLinesMatching(test: string) {
      const config = await context.git.raw('config', '--list', '--show-origin');
      return config.split('\n').filter((line) => line.includes(test));
   }

   it('gets config', async () => {
      await git.addConfig('user.name', 'BAZ');
      expect((await git.getConfig('user.name')).value).toBe('BAZ');
   });

   it('lists config', async () => {
      await git.addConfig('user.name', 'FOO');

      const merged = await git.listConfig();
      const local = await git.listConfig(GitConfigScope.local);

      expect(local.all).toEqual(merged.values[merged.files[merged.files.length - 1]]);
      expect(merged.all['user.name']).toBe('FOO');
      expect(local.all['user.name']).toBe('FOO');
   });

   it('adds a configuration setting', async () => {
      await git.addConfig('user.name', 'FOO BAR');

      expect(await configurationLinesMatching('FOO BAR')).toHaveLength(1);
   });

   it('replaces a configuration setting', async () => {
      await git.addConfig('user.name', 'FOO BAR');
      await git.addConfig('user.name', 'BAZ BAT');

      expect(await configurationLinesMatching('FOO BAR')).toHaveLength(0);
      expect(await configurationLinesMatching('BAZ BAT')).toHaveLength(1);
   });

   it('appends a configuration setting', async () => {
      await git.addConfig('user.name', 'FOO BAR', true);
      await git.addConfig('user.name', 'BAZ BAT', true);

      expect(await configurationLinesMatching('FOO BAR')).toHaveLength(1);
      expect(await configurationLinesMatching('BAZ BAT')).toHaveLength(1);
   });

   it('lists current configuration - single values in local scope', async () => {
      await git.addConfig('user.name', 'HELLO');
      expect((await git.listConfig()).all['user.name']).toBe('HELLO');

      await git.addConfig('user.name', 'GOOD BYE');
      expect((await git.listConfig()).all['user.name']).toBe('GOOD BYE');
   });

   it('lists current configuration - array of values in local scope', async () => {
      await git.addConfig('user.name', 'Abc');
      await git.addConfig('user.name', 'Def', true);

      expect((await git.listConfig()).all['user.name']).toEqual(['Abc', 'Def']);
   });
});
