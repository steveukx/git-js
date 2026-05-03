import {promiseError, promiseResult} from '@kwsites/promise-result';
import {assertExecutedCommands, assertGitError, closeWithSuccess, newSimpleGit,} from '../__fixtures__';

describe('blockUnsafeOperationsPlugin', () => {

   it.each([
      ['protocol.allow=always'],
      ['PROTOCOL.ALLOW=always'],
      ['Protocol.Allow=always'],
      ['PROTOCOL.allow=always'],
      ['protocol.ALLOW=always'],
   ])('blocks protocol override in format %s', async (cmd) => {
      const task = ['config', '-c', cmd, 'config', '--list'];

      assertGitError(
         await promiseError(newSimpleGit().raw(...task)),
         'allowUnsafeProtocolOverride',
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
         'allowUnsafePack',
      );

      const err = promiseError(
         newSimpleGit({ unsafe: { allowUnsafePack: true } }).raw(cmd, option),
      );

      await closeWithSuccess();
      expect(await err).toBeUndefined();
      assertExecutedCommands(cmd, option);
   });

   it('clone non-default branch is allowed (#1137)', async () => {
      const git = newSimpleGit();
      promiseResult(git.clone('https://github.com/example/bruno.git', '/tmp/target', ['-b', 'non-default-branch']));

      await promiseError(closeWithSuccess());

      assertExecutedCommands('clone', '-b', 'non-default-branch', '--', 'https://github.com/example/bruno.git', '/tmp/target');
   });

   it('clone branch name containing "u" is not a vulnerability (#1162)', async () => {
      const git = newSimpleGit();
      promiseResult(git.clone('https://github.com/example/repo.git', '/tmp/target', ['--depth', '1', '-b', 'lb-auto-voc']));

      await promiseError(closeWithSuccess());

      assertExecutedCommands('clone', '--depth', '1', '-b', 'lb-auto-voc', '--', 'https://github.com/example/repo.git', '/tmp/target');
   });

   describe.each([
      ['allowUnsafeSshCommand', `core.sshCommand=sh -c 'id > pwned'`],
      ['allowUnsafeGitProxy', `core.gitProxy=sh -c 'id > pwned'`],
      ['allowUnsafeHooksPath', `core.hooksPath=sh -c 'id > pwned'`],
      ['allowUnsafeDiffExternal', `diff.external=sh -c 'id > pwned'`],
   ])('unsafe config option - %s', (setting, command) => {

      it('blocks by default', async () => {
         const err = promiseError(
            newSimpleGit().clone('remote', 'local', ['-c', command]),
         );
         await promiseError(closeWithSuccess());

         assertGitError(await err, setting);
      });

      it('allows with override', async () => {
         const err = promiseError(
            newSimpleGit({ unsafe: { [setting]: true } }).clone('remote', 'local', ['-c', command]),
         );
         await closeWithSuccess();

         expect(await err).toBeUndefined();
      });
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
