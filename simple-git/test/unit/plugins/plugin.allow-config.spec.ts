import { promiseError } from '@kwsites/promise-result';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('allowConfig', () => {
   let emitWarning: MockInstance<typeof process.emitWarning>;

   beforeEach(() => {
      emitWarning = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
   });

   afterEach(() => emitWarning.mockRestore());

   describe('built-in safe keys', () => {
      it.each([
         ['user.name=me'],
         ['USER.EMAIL=me@example.com'],
         ['color.diff.meta=blue'],
         ['http.https://example.com/.extraHeader=Authorization: Bearer x'],
      ])('runs %s without warning', async (config) => {
         const task = newSimpleGit({ strictConfig: true }).raw('-c', config, 'status');
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
         expect(emitWarning).not.toHaveBeenCalled();
      });
   });

   describe('known unsafe keys', () => {
      it('blocks by default and names both options in the error', async () => {
         const err = await promiseError(newSimpleGit().raw('-c', 'core.sshCommand=evil', 'fetch'));

         assertGitError(err, 'allowUnsafeSshCommand');
         assertGitError(err, 'adding "core.sshcommand" to the allowConfig option');
      });

      it.each([
         [['core.sshCommand'], 'core.sshCommand=ssh -i key', 'fetch'],
         [['CORE.SSHCOMMAND'], 'core.sshCommand=ssh -i key', 'fetch'],
         [['filter.*'], 'filter.lfs.smudge=git-lfs smudge %f', 'checkout'],
         [['url.*.insteadOf'], 'url.git@github.com:.insteadOf=https://github.com/', 'fetch'],
         [['protocol.*.allow'], 'protocol.ext.allow=always', 'fetch'],
         [['sendemail.smtpServer'], 'sendemail.smtpServer=/usr/sbin/sendmail', 'send-email'],
         [['sendemail.*.toCmd'], 'sendemail.work.toCmd=./get-maintainers', 'send-email'],
         [['instaweb.httpd'], 'instaweb.httpd=apache2', 'instaweb'],
         [['interactive.diffFilter'], 'interactive.diffFilter=delta --color-only', 'add'],
         [
            ['gpg.ssh.allowedSignersFile'],
            'gpg.ssh.allowedSignersFile=./allowed-signers',
            'verify-commit',
         ],
         [['browser.firefox.path'], 'browser.firefox.path=/opt/firefox/firefox', 'help'],
         [['man.*.cmd'], 'man.custom.cmd=custom-viewer', 'help'],
      ])('allowConfig %j permits %s', async (allowConfig, config, command) => {
         const task = newSimpleGit({ allowConfig }).raw('-c', config, command);
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
         assertExecutedCommands('-c', config, command);
      });

      it('allowConfig only permits the named key', async () => {
         assertGitError(
            await promiseError(
               newSimpleGit({ allowConfig: ['core.sshCommand'] }).raw(
                  '-c',
                  'core.sshCommand=ssh',
                  '-c',
                  'core.pager=evil',
                  'log'
               )
            ),
            'allowUnsafePager'
         );
      });

      it('allowConfig applies to the config option', async () => {
         const task = newSimpleGit({
            config: ['core.sshCommand=ssh -i key'],
            allowConfig: ['core.sshCommand'],
         }).fetch();
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
      });

      it('allowConfig applies to persistent config writes', async () => {
         const task = newSimpleGit({ allowConfig: ['core.hooksPath'] }).addConfig(
            'core.hooksPath',
            '.githooks'
         );
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
      });

      it('allowConfig applies to GIT_CONFIG_KEY_<n>', async () => {
         const git = newSimpleGit({
            allowConfig: ['core.pager'],
            allowEnvironment: ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'],
         }).env({
            GIT_CONFIG_COUNT: '1',
            GIT_CONFIG_KEY_0: 'core.pager',
            GIT_CONFIG_VALUE_0: 'cat',
         });

         const task = git.raw('log');
         await closeWithSuccess();
         expect(await promiseError(task)).toBeUndefined();
      });

      it('deprecated unsafe flags continue to permit their keys', async () => {
         const task = newSimpleGit({ unsafe: { allowUnsafeSshCommand: true } }).raw(
            '-c',
            'core.sshCommand=ssh',
            'fetch'
         );
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
         expect(emitWarning).not.toHaveBeenCalled();
      });
   });

   describe('runtime sanitising of the allowConfig option', () => {
      it('accepts a single string', async () => {
         const task = newSimpleGit({
            allowConfig: 'core.sshCommand' as unknown as string[],
         }).raw('-c', 'core.sshCommand=ssh', 'fetch');
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
      });

      it('ignores null, undefined and empty entries', async () => {
         const task = newSimpleGit({
            allowConfig: [null, undefined, '', '  ', 'core.sshCommand'] as unknown as string[],
         }).raw('-c', 'core.sshCommand=ssh', 'fetch');
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
      });

      it.each([[null], [undefined]])('does not treat %s as a key name', async (entry) => {
         const key = String(entry);

         assertGitError(
            await promiseError(
               newSimpleGit({
                  strictConfig: true,
                  allowConfig: [entry] as unknown as string[],
               }).raw('-c', `${key}=1`, 'status')
            ),
            'adding it to the allowConfig option'
         );
      });

      it('accepts a null option', async () => {
         const task = newSimpleGit({ allowConfig: null as unknown as string[] }).raw(
            '-c',
            'user.name=me',
            'status'
         );
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
      });
   });

   describe('unlisted keys', () => {
      it('warns once per key by default', async () => {
         const first = newSimpleGit().raw('-c', 'unlisted.first=1', 'status');
         await closeWithSuccess();
         const second = newSimpleGit().raw('-c', 'unlisted.first=2', 'status');
         await closeWithSuccess();

         expect(await promiseError(first)).toBeUndefined();
         expect(await promiseError(second)).toBeUndefined();
         expect(emitWarning).toHaveBeenCalledTimes(1);
         expect(emitWarning).toHaveBeenCalledWith(
            expect.stringContaining('"unlisted.first"'),
            expect.objectContaining({ code: 'SIMPLE_GIT_UNLISTED_CONFIG' })
         );
      });

      it('blocks with strictConfig', async () => {
         assertGitError(
            await promiseError(
               newSimpleGit({ strictConfig: true }).raw('-c', 'unlisted.second=1', 'status')
            ),
            'adding it to the allowConfig option'
         );
      });

      it('permits with strictConfig when named in allowConfig', async () => {
         const task = newSimpleGit({ strictConfig: true, allowConfig: ['unlisted.*'] }).raw(
            '-c',
            'unlisted.third=1',
            'status'
         );
         await closeWithSuccess();

         expect(await promiseError(task)).toBeUndefined();
         expect(emitWarning).not.toHaveBeenCalled();
      });
   });
});

describe('allowEnvironment as a replacement for unsafe environment flags', () => {
   it('blocks GIT_SSH_COMMAND supplied through .env() by default', async () => {
      const err = await promiseError(newSimpleGit().env({ GIT_SSH_COMMAND: 'evil' }).raw('fetch'));

      assertGitError(err, 'allowUnsafeSshCommand');
   });

   it('permits GIT_SSH_COMMAND when named in allowEnvironment', async () => {
      const task = newSimpleGit({ allowEnvironment: ['GIT_SSH_COMMAND'] })
         .env({ GIT_SSH_COMMAND: 'ssh -i key' })
         .raw('fetch');
      await closeWithSuccess();

      expect(await promiseError(task)).toBeUndefined();
   });

   it('still requires allowUnsafeConfigEnvCount for GIT_CONFIG_PARAMETERS', async () => {
      const err = await promiseError(
         newSimpleGit({ allowEnvironment: ['GIT_CONFIG_PARAMETERS'] })
            .env({ GIT_CONFIG_PARAMETERS: `'core.pager'='evil'` })
            .raw('log')
      );

      assertGitError(err, 'allowUnsafeConfigEnvCount');
   });
});
