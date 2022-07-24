import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';
import { ResetMode } from '../../src/lib/tasks/reset';

describe('reset', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it.each<[ResetMode, string]>(
      ['hard', 'soft', 'merge', 'mixed', 'keep'].map((mode) => [mode as ResetMode, `--${mode}`])
   )('%s mode', async (mode, command) => {
      await assertNonErrorReset(git.reset(mode), [command]);
   });

   it('defaults to soft mode when supplying bad values', async () => {
      await assertNonErrorReset(git.reset('unknown' as any), ['--soft']);
   });

   it('reset hard to commit as options array', async () => {
      await assertNonErrorReset(git.reset(['commit-ish', '--hard']), ['commit-ish', '--hard']);
   });

   it('reset keep to commit as options object', async () => {
      await assertNonErrorReset(git.reset({ '--keep': null, 'commit-ish': null }), [
         '--keep',
         'commit-ish',
      ]);
   });

   it('reset hard to commit as mode with options array', async () => {
      await assertNonErrorReset(git.reset('hard' as ResetMode, ['commit-ish']), [
         '--hard',
         'commit-ish',
      ]);
   });

   it('reset keep to commit as mode with options object', async () => {
      await assertNonErrorReset(git.reset('keep' as ResetMode, { 'commit-ish': null }), [
         '--keep',
         'commit-ish',
      ]);
   });

   it('resets a single file as options array', async () => {
      await assertNonErrorReset(git.reset(['--', 'path/to-file.txt']), ['--', 'path/to-file.txt']);
   });

   it('resets a single file as options object', async () => {
      await assertNonErrorReset(git.reset({ '--': null, 'path/to-file.txt': null }), [
         '--',
         'path/to-file.txt',
      ]);
   });

   it('resets a single file with mode and options array', async () => {
      const resetOptions = ['--', 'path/to-file.txt'];

      await assertNonErrorReset(git.reset('hard' as ResetMode, resetOptions), [
         '--hard',
         ...resetOptions,
      ]);
   });

   it('with callback handler', async () => {
      await assertNonErrorReset(git.reset(ResetMode.MIXED, callback), ['--mixed']);
   });

   it('with no arguments', async () => {
      await assertNonErrorReset(git.reset(), ['--soft']);
   });

   async function assertNonErrorReset(task: Promise<string>, commands: string[]) {
      closeWithSuccess('success');

      expect(await task).toBe('success');
      assertExecutedCommands('reset', ...commands);
   }
});
