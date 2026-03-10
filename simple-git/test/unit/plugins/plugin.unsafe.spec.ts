import { promiseError, promiseResult } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';
import { isCloneUploadPackSwitch } from '../../../src/lib/plugins/block-unsafe-operations-plugin';

describe('blockUnsafeOperationsPlugin', () => {

   it.each([
      ['-b', false],
      ['non-default-branch', false],
      ['u', false],
      ['-u', true],
      ['\0-bu', true],
      ['--no-bu', true],
   ])('detects clone switch in "%s"', async (arg, expected) => {
      expect(isCloneUploadPackSwitch('u', arg)).toBe(expected);
   });

   it.each([
      ['protocol.allow=always'],
      ['PROTOCOL.ALLOW=always'],
      ['Protocol.Allow=always'],
      ['PROTOCOL.allow=always'],
      ['protocol.ALLOW=always'],
   ])('blocks protocol overide in format %s', async (cmd) => {
      const task = ['config', '-c', cmd, 'config', '--list'];

      assertGitError(
         await promiseError(newSimpleGit().raw(...task)),
         'allowUnsafeExtProtocol'
      );

      const err = promiseError(
         newSimpleGit({ unsafe: { allowUnsafeProtocolOverride: true } }).raw(...task),
      );

      await closeWithSuccess();
      expect(await err).toBeUndefined();
      assertExecutedCommands(...task);
   });

   it.each([
      ['clone', '-u touch /tmp/pwn'],
      ['cmd', '--upload-pack=touch /tmp/pwn0'],
      ['cmd', '--receive-pack=touch /tmp/pwn1'],
      ['push', '--exec=touch /tmp/pwn2'],
   ])('allows %s %s only when using override', async (cmd, option) => {
      assertGitError(
         await promiseError(newSimpleGit({ unsafe: {} }).raw(cmd, option)),
         'allowUnsafePack'
      );

      const err = promiseError(
         newSimpleGit({ unsafe: { allowUnsafePack: true } }).raw(cmd, option)
      );

      await closeWithSuccess();
      expect(await err).toBeUndefined();
      assertExecutedCommands(cmd, option);
   });

   it('', async () => {
      const git = newSimpleGit();
      promiseResult(git.clone('https://github.com/example/bruno.git', '/tmp/target', ['-b', 'non-default-branch']));

      await promiseError(closeWithSuccess());

      assertExecutedCommands('clone', '-b', 'non-default-branch', '--', 'https://github.com/example/bruno.git', '/tmp/target');
   });

   it('allows -u for non-clone commands', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = promiseError(git.raw('push', '-u', 'origin/main'));

      await closeWithSuccess();
      expect(await err).toBeUndefined();
      assertExecutedCommands('push', '-u', 'origin/main');
   });

   it('uses pathspec protection for -u in remote', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = promiseError(git.clone('-u touch /tmp/pwn', 'file:///tmp/zero12'));
      await promiseError(closeWithSuccess());

      expect(await err).toBeUndefined();
      assertExecutedCommands('clone', '--', '-u touch /tmp/pwn', 'file:///tmp/zero12');
   });

   it('allows -u for clone command with override', async () => {
      const git = newSimpleGit({ unsafe: { allowUnsafePack: true } });
      const err = promiseError(git.clone('-u touch /tmp/pwn', 'file:///tmp/zero12'));

      await closeWithSuccess();
      expect(await err).toBeUndefined();
      assertExecutedCommands('clone', '--', '-u touch /tmp/pwn', 'file:///tmp/zero12');
   });

   it('blocks pull --upload-pack', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = await promiseError(git.pull('--upload-pack=touch /tmp/pwn0', 'master'));

      assertGitError(err, 'allowUnsafePack');
   });

   it('blocks push --receive-pack', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = await promiseError(git.push('--receive-pack=touch /tmp/pwn1', 'master'));

      assertGitError(err, 'allowUnsafePack');
   });

   it('blocks raw --upload-pack', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = await promiseError(git.raw('pull', `--upload-pack=touch /tmp/pwn0`));

      assertGitError(err, 'allowUnsafePack');
   });

   it('blocks raw --receive-pack', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = await promiseError(git.raw('push', `--receive-pack=touch /tmp/pwn1`));

      assertGitError(err, 'allowUnsafePack');
   });

   it('blocks listRemote --upload-pack', async () => {
      const git = newSimpleGit({ unsafe: {} });
      const err = await promiseError(git.listRemote(['--upload-pack=touch /tmp/pwn2', 'main']));

      assertGitError(err, 'allowUnsafePack');
   });
});
