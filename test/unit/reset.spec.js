const {theCommandRun, closeWithSuccess, newSimpleGit, restore} = require('./include/setup');
const {ResetMode} = require('../..');

describe('reset', () => {

   let git, callback;

   beforeEach(() => {
      callback = jest.fn();
      git = newSimpleGit()
   });

   afterEach(() => restore());

   it.each(
      ['hard', 'soft', 'merge', 'mixed', 'keep'].map(mode => [mode, `--${ mode }`])
   )('%s mode', async (mode, command) => {
      await assertReset([mode], [command]);
   });

   it('defaults to soft mode when supplying bad values', async () => {
      await assertReset(['unknown'], ['--soft']);
   });

   it('reset hard to commit as options array', async () => {
      await assertReset([['commit-ish', '--hard']], ['commit-ish', '--hard']);
   });

   it('reset keep to commit as options object', async () => {
      await assertReset([{'--keep': null, 'commit-ish': null}], ['--keep', 'commit-ish']);
   });

   it('reset hard to commit as mode with options array', async () => {
      await assertReset(['hard', ['commit-ish']], ['--hard', 'commit-ish']);
   });

   it('reset keep to commit as mode with options object', async () => {
      await assertReset(['keep', {'commit-ish': null}], ['--keep', 'commit-ish']);
   });

   it('resets a single file as options array', async () => {
      const resetOptions = ['--', 'path/to-file.txt'];
      const commandsRun = [...resetOptions];

      await assertReset([resetOptions], commandsRun);
   });

   it('resets a single file as options object', async () => {
      const resetOptions = {'--': null, 'path/to-file.txt': null};
      const commandsRun = ['--', 'path/to-file.txt'];

      await assertReset([resetOptions], commandsRun);
   });

   it('resets a single file with mode and options array', async () => {
      const resetOptions = ['--', 'path/to-file.txt'];
      const commandsRun = ['--hard', ...resetOptions];

      await assertReset(['hard', resetOptions], commandsRun);
   });

   it('with callback handler', async () => {
      await assertReset([ResetMode.MIXED, callback], ['--mixed'], 'git-response');
      expect(callback).toHaveBeenCalledWith(null, 'git-response');
   });

   it('with no arguments', async () => {
      await assertReset([], ['--soft']);
   });

   async function assertReset (input, commands, success = '') {
      const result = git.reset(...input);
      await closeWithSuccess(success);

      expect(typeof await result).toBe('string');
      expect(theCommandRun()).toEqual(['reset', ...commands]);
   }

})

