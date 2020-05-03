const Test = require('./include/runner');

describe('branches', () => {

   let context, git;

   function run (...commands) {
      return context.gitP(context.root).raw(commands);
   }

   async function configurationLinesMatching (test) {
      const config = await run('config', '--list', '--show-origin');
      return config.split('\n').filter(line => line.includes(test));
   }

   beforeEach(async () => {
      context = Test.createContext();

      await run('init');
      git = context.gitP(context.root);
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

      expect((await git.listConfig()).all['user.name']).toEqual(
         ['Abc', 'Def']
      );
   });



});
